package main

import (
	"encoding/json"
	"github.com/gofrs/uuid"
	"math/rand"
	"strconv"

	"github.com/gorilla/securecookie"
	"golang.org/x/crypto/bcrypt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path"
	"sync"
)

type GameUser struct {
	Id                string
	Name              string
	CharacterAdded    string
	CharacterAssigned string
	Won               bool
	Host              bool
}

type Game struct {
	Started    bool
	PassHash   string
	PublicName string
	Id         string
	GameUsers  []*GameUser
}

type User struct {
	Log      string
	PassHash string `json:"-"`
}

type Settings struct {
	Games []*Game
	Users []*User
	M     sync.RWMutex `json:"-"`
}

func (s *Settings) RemoveGame(gameId string) {
	s.M.Lock()
	defer s.M.Unlock()

	for inx, g := range s.Games {
		if g.Id == gameId {
			s.Games = append(s.Games[:inx], s.Games[inx+1:]...)
		}
	}

}

func (s *Settings) findGame(gameId string) *Game {
	s.M.RLock()
	defer s.M.RUnlock()

	for _, g := range s.Games {
		if g.Id == gameId {
			return g
		}
	}
	return nil
}

func (g *Game) findUser(userId string) *GameUser {

	for _, g := range g.GameUsers {
		if g.Id == userId {
			return g
		}
	}

	return nil
}

func getSettings() *Settings {
	Settings := Settings{
		M: sync.RWMutex{},
	}
	jsonFile, err := os.Open(path.Join(dir, "files", "games.json"))
	if err == nil {
		byteValue, _ := ioutil.ReadAll(jsonFile)
		json.Unmarshal(byteValue, &Settings)
	}

	defer jsonFile.Close()
	return &Settings
}

func saveSettings(s *Settings) error {
	b, _ := json.Marshal(s)

	err := ioutil.WriteFile(path.Join(dir, "files", "games.json"), b, 0)
	if err != nil {
		return err
	} else {
		return nil
	}
}

func addCorsHeader(res http.ResponseWriter) {
	headers := res.Header()
	headers.Add("Access-Control-Allow-Origin", "*, localhost")
	headers.Add("Vary", "Origin")
	headers.Add("Vary", "Access-Control-Request-Method")
	headers.Add("Vary", "Access-Control-Request-Headers")
}

func enableCors(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")

	//	(*w).Header().Set("Access-Control-Allow-Origin", "*")
	(*w).Header().Set("Access-Control-Allow-Credentials", "true")
	//	(*w).Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
	(*w).Header().Set("Access-Control-Allow-Headers", "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With, game_id, pass, name, character, user")
	//	(*w).Header().Set("Content-Type", "application/json")
}

var cookieHandler = securecookie.New(
	[]byte("asdasdasdasdasd22131231231dasdas"),
	[]byte("asda123123asdasddasdasd0294jd88d"))

func getUUID(request *http.Request) (string, error) {
	var UUID string

	if cookie, err := request.Cookie("session"); err == nil {
		cookieValue := make(map[string]string)
		if err = cookieHandler.Decode("session", cookie.Value, &cookieValue); err == nil {
			UUID = cookieValue["id"]
		} else {
			println(err)
			return "", err
		}
	}
	return UUID, nil
}

func setSession(uuid string, response http.ResponseWriter) {
	value := map[string]string{
		"id": uuid,
	}

	if encoded, err := cookieHandler.Encode("session", value); err == nil {
		cookie := &http.Cookie{
			Name:  "session",
			Value: encoded,
			Path:  "/",
		}
		http.SetCookie(response, cookie)

		cookie = &http.Cookie{
			Name:     "session",
			Value:    encoded,
			Path:     "/",
			Domain:   "localhost",
			SameSite: 2,
		}
		http.SetCookie(response, cookie)
	}
}

func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

func hashAndSalt(pwd string) string {
	bytes, _ := bcrypt.GenerateFromPassword([]byte(pwd), 5)
	return string(bytes)
}

func CorrectLogPass(log, pass string) bool {
	return log != "" && pass != "" && len(log) > 4 && len(pass) > 5
}

func getGameId(r *http.Request) string {
	return r.Header.Get("game_id")
}

func joinGame(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	userid, err := getUUID(r)
	if err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	game_id := getGameId(r)

	pass := r.Header.Get("pass")

	game := s.findGame(game_id)

	if game == nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("no such game"))

		return
	}

	if game.Started {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("game started"))
		return
	}

	if !CheckPasswordHash(pass, game.PassHash) {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("wrong passwrod"))
		return
	}

	foundUser := false
	for _, u := range game.GameUsers {
		if u.Id == userid {
			foundUser = true
		}
	}

	if !foundUser {
		game.GameUsers = append(game.GameUsers, &GameUser{Id: userid})
	}

	err = saveSettings(s)
	if err != nil {
		log.Print(err)
	}
	ba, _ := json.Marshal(game)
	w.WriteHeader(http.StatusOK)
	w.Write(ba)
}

func createGame(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	var gameId = uuid.Must(uuid.NewV4())
	pass := r.Header.Get("pass")
	game_name := r.Header.Get("name")

	userid, err := getUUID(r)
	if err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	if userid == "" {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("No userid"))
		return
	}

	var users = []*GameUser{
		{Id: userid, Won: false, Host: true},
	}
	if game_name == "" {
		game_name = "Game" + strconv.Itoa(len(s.Games)+1)
	}

	newgame := &Game{
		PublicName: game_name,
		Id:         gameId.String(),
		GameUsers:  users,
		PassHash:   hashAndSalt(pass),
	}
	s.Games = append(s.Games, newgame)

	go func() {
		err := saveSettings(s)
		if err != nil {
			log.Print(err)
		}
	}()

	ba, _ := json.Marshal(newgame)
	w.WriteHeader(http.StatusOK)
	w.Write(ba)
}

func login(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)

	userid, _ := getUUID(r)

	//var res string
	if userid == "" {
		userid = uuid.Must(uuid.NewV4()).String()
		//	res = "session set"
		setSession(userid, w)
	} else {
		//	res = "already have id"
	}
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(userid))
}

func submitCharacter(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	userid, err := getUUID(r)
	if err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	game_id := getGameId(r)

	g := s.findGame(game_id)
	if g == nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if g.Started {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	u := g.findUser(userid)
	if u == nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	s.M.Lock()
	u.Name = r.Header.Get("name")
	u.CharacterAdded = r.Header.Get("character")
	s.M.Unlock()

	w.WriteHeader(http.StatusOK)
}

func setWin(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	userid, err := getUUID(r)
	if err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	game_id := getGameId(r)
	userToSet := r.Header.Get("user")

	g := s.findGame(game_id)
	if g == nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	u := g.findUser(userid)
	if u == nil || !u.Host {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if !g.Started {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	s.M.Lock()
	utoset := g.findUser(userToSet)
	utoset.Won = true
	s.M.Unlock()

	w.WriteHeader(http.StatusOK)
	err = saveSettings(s)
	if err != nil {
		log.Print(err)
	}
}

func listGames(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	userid, err := getUUID(r)
	if err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	games := struct {
		ToJoin       []Game
		GamesYoureIn []Game
	}{}

	s.M.RLock()
	for _, g := range s.Games {
		if g.findUser(userid) != nil {
			games.GamesYoureIn = append(games.GamesYoureIn, *g)
		} else {
			games.ToJoin = append(games.ToJoin, *g)
		}
	}

	s.M.RUnlock()

	ba, _ := json.Marshal(games)
	w.WriteHeader(http.StatusOK)
	w.Write(ba)
}

func gameInfo(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	userid, err := getUUID(r)
	if err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	game_id := getGameId(r)
	g := s.findGame(game_id)
	if g == nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	u := g.findUser(userid)
	if u == nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	ba, _ := json.Marshal(g)
	w.WriteHeader(http.StatusOK)
	w.Write(ba)
}

func roll(users []*GameUser, allNames []string) {
	copynames := []string{}

	for _, v := range allNames {
		copynames = append(copynames, v)
	}

	for _, v := range users {
		randInx := rand.Intn(len(copynames))
		v.CharacterAssigned = copynames[randInx]
		copynames = append(copynames[:randInx], copynames[randInx+1:]...)
	}
}

func finishGame(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	userid, err := getUUID(r)
	if err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	game_id := getGameId(r)
	g := s.findGame(game_id)
	u := g.findUser(userid)
	if g != nil && u != nil {
		if u.Host {
			s.RemoveGame(game_id)
		}

	}

	w.WriteHeader(http.StatusOK)
}

func hostStartGame(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	userid, err := getUUID(r)
	if err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	game_id := getGameId(r)

	g := s.findGame(game_id)
	if g == nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("no such game"))

		return
	}

	if g.Started {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("game already started"))

		return
	}

	u := g.findUser(userid)
	if u == nil {
		w.Write([]byte("no such user: " + userid))

		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if !u.Host {
		w.Write([]byte("user: " + userid + " is not a host"))

		w.WriteHeader(http.StatusBadRequest)
		return
	}

	s.M.RLock()
	var GameUsersMinusHost []*GameUser

	for _, u := range g.GameUsers {
		//if !u.Host {
		GameUsersMinusHost = append(GameUsersMinusHost, u)
		//}
	}

	allSet := true
	for _, gu := range GameUsersMinusHost {
		if gu.CharacterAdded == "" || gu.Name == "" {
			allSet = false
		}
	}
	s.M.RUnlock()

	if allSet == false {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("not all users set their names"))
		return
	}

	s.M.RLock()
	charNames := []string{}

	for _, u := range GameUsersMinusHost {
		charNames = append(charNames, u.CharacterAdded)
	}

	for x := 0; x < 100; x++ {
		roll(GameUsersMinusHost, charNames)
		sameSet := false
		for _, gu := range GameUsersMinusHost {
			if gu.CharacterAdded == gu.CharacterAssigned {
				sameSet = true
			}
		}
		if !sameSet {
			break
		}
	}

	s.M.RUnlock()

	g.Started = true
	w.WriteHeader(http.StatusOK)
	err = saveSettings(s)
	if err != nil {
		log.Print(err)
	}
}

var dir string

func NoCacheWrapper(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate, post-check=0, pre-check=0")
		next.ServeHTTP(w, r)
	})
}

var s *Settings

func main() {

	port := "8081"

	println("Starting server at host", ":"+port)

	fs := http.FileServer(http.Dir("static"))
	http.Handle("/", NoCacheWrapper(fs))

	http.HandleFunc("/login", login)
	http.HandleFunc("/create_game", createGame)
	http.HandleFunc("/join_game", joinGame)
	http.HandleFunc("/submit_character", submitCharacter)
	http.HandleFunc("/host_start_game", hostStartGame)
	http.HandleFunc("/set_win", setWin)
	http.HandleFunc("/finish_game", finishGame)

	http.HandleFunc("/list_games", listGames)
	http.HandleFunc("/game_info", gameInfo)

	s = getSettings()

	dir, _ = os.Getwd()
	err := http.ListenAndServe(":"+port, nil)
	if err != nil {
		log.Fatal(err)
	}
}
