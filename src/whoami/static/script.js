const passwordJoin = document.querySelector('.join__password');
const nameField = document.querySelector('.create__name');
const passwordField = document.querySelector('.create__password');

const mainScreen = document.querySelector('.main');
const hostLobbyScreen = document.querySelector('.host-lobby');
const playerLobbyScreen = document.querySelector('.player-lobby');
const hostGameScreen = document.querySelector('.host-game');
const playerGameScreen = document.querySelector('.player-game');

const playerName = document.querySelector('.player-name');
const playerCharacter = document.querySelector('.player-character');

const gameInput = document.getElementsByClassName('input-game');

let getGameInfo = (id, cb) => {
    $.ajax({
        url: host + '/game_info',
        contentType: 'application/json; charset=utf-8',
        xhrFields: {withCredentials: true},
        type: 'post',
        data: {},
        headers: {
            game_id: id,
        },
        success: function (data) {
            data = JSON.parse(data);
            if (cb) cb(data);
        },
        error: function (data) {
        },
    });
};

const host = "";

function addUsersRow(tableID, name, charAssigned, userHost, started, wonStatus, userid) {
    const tableRef = document.getElementById(tableID);
    const dataRow = tableRef.insertRow(1);
    $(dataRow).addClass("users-row");
    const nameCell = dataRow.insertCell(0);
    const characterCell = dataRow.insertCell(1);
    nameCell.innerHTML = name;
    characterCell.innerHTML = charAssigned;

    const winStatus = dataRow.insertCell(2);

    if (wonStatus === true) {
        winStatus.innerHTML = `<div style="min-width: 100px;">Won</div>`;
    } else {
        winStatus.innerHTML = `<div style="min-width: 100px;">-</div>`;
    }


    nameCell.classList.add('user');
    if (userHost) {
        nameCell.classList.add('userhost');
    }
    //if (userHost) {

        if (started && window.isHost && wonStatus === false) {
            winStatus.innerHTML = `<button class="btn wincolumn" type="submit">Win</button>`;
            winStatus.addEventListener('click', () => {
                setWinFor(userid)
            })
        }
    //}


}

let globalUpdate = () => {
    getGameInfo(window.CurrentGame.Id, (data) => {
        redrawUsers(data);
        window.CurrentGame = data;
    })
}

let redrawUsers = (game) => {
    if (game.Started) {

        $("#finish").show();
        $(".player-name").hide();
        $(".player-character").hide();
        $("#start-game").hide();
        $("#submit_character").hide();
    } else {
        $("#finish").hide();
        $(".player-name").show();
        $(".player-character").show();
        $("#submit_character").show();
    }

    if (!game.Started)
        $(".wincolumn").hide();


    $(".users-row").remove();
    window.isHost = false;
    game.GameUsers.forEach(e => {
        if (e.Id == window.MyId) {
            window.isHost = e.Host;
        }
    });

    if (window.isHost &&  !(game.Started) ) $("#start-game").show(); else
        $("#start-game").hide();

    game.GameUsers.forEach(e => {
        let name = e.Name;
        let charAssigned = "*****";
        if (window.isHost || e.Id == window.MyId)
            charAssigned = e.CharacterAdded;

        if (game.Started) {
            if ((window.isHost || e.Won ))
            charAssigned = e.CharacterAssigned; else {
                charAssigned = "*****";
            }

        }

        addUsersRow('js-player-lobby', name, charAssigned, e.Host, game.Started, e.Won, e.Id);
    });
};

let updateUserScreen = (data) => {
    window.CurrentGame = data;


    redrawUsers(window.CurrentGame);
    globalUpdate();

    setInterval(() => {
        globalUpdate();
    }, 1000);

    mainScreen.style.display = 'none';
    playerLobbyScreen.style.display = 'flex';
};

window.onload = (e) => {
    $.ajax({
        url: '/login',
        contentType: 'application/json; charset=utf-8',
        xhrFields: {withCredentials: true},
        type: 'post',
        data: {},
        headers: {},
        success: function (data) {
            window.MyId = data;
        },
        error: function (data) {
        },
    });

    $.ajax({
        url: host + '/list_games',
        contentType: 'application/json; charset=utf-8',
        xhrFields: {withCredentials: true},
        dataType: "json",
        type: 'post',
        data: {},
        success: function (data) {
            let toJoin = data.ToJoin ? data.ToJoin : [];
            let myGames = data.GamesYoureIn ? data.GamesYoureIn : [];
            window.AllGames = toJoin.concat(myGames);
            if (data.GamesYoureIn) {

                data.GamesYoureIn.forEach(element => {
                    let gameName = element.PublicName;
                    let gameId = element.Id;
                    element.ImIn = true;
                    addRow('js-table', gameId, gameName, true);
                });

                $('input:radio[name="game"]').change(function () {
                    gameId = $(this).attr("id");
                    window.selectedGame = gameId;
                    window.CurrentGame = window.AllGames.find(e => {
                        return e.Id == gameId;
                    });
                });
            }

            if (data.ToJoin) {
                window.toJoin = data.ToJoin;
                data.ToJoin.forEach(element => {
                    let gameName = element.PublicName;
                    let gameId = element.Id;
                    addRow('js-table', gameId, gameName);
                });

                $('input:radio[name="game"]').change(function () {
                    gameId = $(this).attr("id");
                    window.selectedGame = gameId;
                    window.CurrentGame = window.AllGames.find(e => {
                        return e.Id == gameId;
                    });
                });
            }

            console.info(data);
        },
        error: function (data) {
            console.info(data);
        },
    });

    function addRow(tableID, gameId, gameName, mygames) {
        const tableRef = document.getElementById(tableID);
        const joinRow = tableRef.insertRow(1);
        const joinCell = joinRow.insertCell(0);
        joinCell.innerHTML = `<input id="${gameId}" class="input-game" type="radio" name="game" value="${gameId}">
    <label for="${gameId}" class="select-game">${gameName}</label>`;
        if (mygames)
            joinCell.setAttribute("style", "background-color: orange");
    }
};

document.getElementById('join-game').addEventListener('click', () => {
    if (!window.CurrentGame) {

        $("#select-game").show(0);
        setTimeout(() => {
            $("#select-game").hide(150);
        }, 2000);
        return;
    }

    if (window.CurrentGame && window.CurrentGame.ImIn) {
        updateUserScreen(window.CurrentGame);
    } else if (passwordJoin.value != '' && window.selectedGame) {
        $.ajax({
            url: host + '/join_game',
            contentType: 'application/json; charset=utf-8',
            xhrFields: {withCredentials: true},
            type: 'post',
            headers: {
                game_id: window.selectedGame,
                pass: passwordJoin.value,
            },
            data: {},
            success: function (data) {
                data = JSON.parse(data);
                updateUserScreen(data);
            },
            error: function (data) {
                $("#error-pass").show(0);
                setTimeout(() => {
                    $("#error-pass").hide(2000);
                }, 2000);
                console.info(data);
            },
        });

    } else {
        alert('Please, enter your password')
    }
});


document.getElementById('create-game').addEventListener('click', () => {
    if (nameField.value != '' && passwordField.value != '') {
        $.ajax({
            url: host + '/create_game',
            contentType: 'application/json; charset=utf-8',
            xhrFields: {withCredentials: true},
            type: 'post',
            data: {},
            headers: {
                pass: passwordField.value,
                "name": nameField.value,
            },
            success: function (data) {
                data = JSON.parse(data);
                updateUserScreen(data);
                //globalUpdate();
            },
            error: function (data) {
                console.info(data);
            },
        });


        function addUsersRow(tableID, getName, getCharacter, userHost) {
            const tableRef = document.getElementById(tableID);
            const dataRow = tableRef.insertRow(1);
            const nameCell = dataRow.insertCell(0);
            const characterCell = dataRow.insertCell(1);
            nameCell.innerHTML = getName;
            characterCell.innerHTML = getCharacter;

            const winStatus = dataRow.insertCell(2);
            nameCell.innerHTML = getName;
            characterCell.innerHTML = charAssigned;


            if (status === true) {
                winStatus.innerHTML = 'Win';
            } else {
                winStatus.innerHTML = '';
            }

            if (userHost) {
                nameCell.classList.add('user')
            }
        }

        mainScreen.style.display = 'none';
        playerLobbyScreen.style.display = 'flex';
    } else {
        alert('Please, enter your game name and password')
    }
});
// host lobby script
document.getElementById('start-game').addEventListener('click', () => {
//  const submitActive = document.getElementById('submit-character').disabled;
//  if (submitActive) {
    $.ajax({
        url: host + '/host_start_game',
        contentType: 'application/json; charset=utf-8',
        xhrFields: {withCredentials: true},
        type: 'post',
        data: {},
        headers: {
            game_id: window.CurrentGame.Id,
        },
        success: function (data) {
            console.info(data);

        },
        error: function (data) {
            console.info(data);
            $("#error-start").show(0);
            setTimeout(() => {
                $("#error-start").hide(150);
            }, 2000);
        },
    });

    /*  } else {
        alert('Please, enter your name and character')
      }*/
});


// player lobby script
document.getElementById('submit_character').addEventListener('click', () => {
    if (playerName.value != '' && playerCharacter.value != '') {
        $.ajax({
            url: host + '/submit_character',
            contentType: 'application/json; charset=utf-8',
            xhrFields: {withCredentials: true},
            type: 'post',
            headers: {
                game_id: window.CurrentGame.Id,
                name: playerName.value,
                character: playerCharacter.value
            },
            data: {},
            success: function (data) {
                globalUpdate();
                console.info(data);
                /* window.CurrentGame.GameUsers.forEach(e => {
                   userStatus = e.Won;
                   getName = e.Name;
                   charAssigned = e.CharacterAssigned;
                   isHost = e.Host;
                 //  addWinnersRow('player-winner-list', getName, charAssigned, userStatus, isHost);
                   console.info(e.Name);
                 })*/
            },
            error: function (data) {
                console.info(data);
            },
        });

        //  playerLobbyScreen.style.display = 'none'
        //  playerGameScreen.style.display = 'flex'
    } else {
        alert('Please, enter your name and character')
    }
});


let setWinFor = (id) => {
    $.ajax({
        url: host + '/set_win',
        contentType: 'application/json; charset=utf-8',
        xhrFields: {withCredentials: true},
        type: 'post',
        headers: {
            game_id: window.CurrentGame.Id,
            user: id,
        },
        data: {},
        success: function (data) {
            console.info(data);
            globalUpdate()
        },
        error: function (data) {
            console.info(data);
        },
    });

}


document.getElementById('finish').addEventListener('click', () => {
    window.open('./', target = '_self')
});
