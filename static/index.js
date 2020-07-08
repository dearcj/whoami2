


let host = "";
//let host = "http://game-whoami.herokuapp.com";

//Login will store user Id inside cookies
$("#login").click(()=>{
    $.ajax({
        url: host + '/login',
        contentType: 'application/json; charset=utf-8',
        xhrFields: { withCredentials: true },
        type: 'post',
        data: {
        },
        headers: {
        },
        success: function (data) {
            console.info(data);
        },
        error: function (data) {
        console.info(data);
    },
    });
});


//By creating new game you automatically became host, and join it
$("#create-game").click(()=>{
    $.ajax({
        url: host + '/create_game',
        contentType: 'application/json; charset=utf-8',
        xhrFields: { withCredentials: true },
        type: 'post',
        data: {
        },
        headers: {
            pass: "test123",
            "name": "TestGame",
        },
        success: function (data) {
            console.info(data);
        },
        error: function (data) {
            console.info(data);
        },
    });
});


//Get list of all current games {GamesYoureIn: [], ToJoin: []}
$("#list-games").click(()=>{
    $.ajax({
        xhrFields: { withCredentials: true },
        url: host + '/list_games',
        contentType: 'application/json; charset=utf-8',
        dataType: "json",
        type: 'post',
        data: {
        },

        success: function (data) {
            if (data.GamesYoureIn)
            window.gameImIn = data.GamesYoureIn[0];

            if (data.ToJoin)
                window.toJoin = data.ToJoin[0];

            console.info(data);
        },
        error: function (data) {
            console.info(data);
        },
    });
});

//Get game info by ID
$("#game-info").click(()=>{
    $.ajax({
        xhrFields: { withCredentials: true },
        url: host + '/game_info',
        contentType: 'application/json; charset=utf-8',
        type: 'post',
        data: {
        },
        headers: {
            game_id: window.gameImIn.Id,
        },
        success: function (data) {
            console.info(data);
        },
        error: function (data) {
            console.info(data);
        },
    });
});

//Join game with game_id and password
$("#join-game").click(()=>{
    $.ajax({
        xhrFields: { withCredentials: true },
        url: host + '/join_game',
        contentType: 'application/json; charset=utf-8',
        type: 'post',
        headers: {
            game_id: window.toJoin.Id,
            pass: "test123",
        },
        data: {
        },

        success: function (data) {
            console.info(data);
        },
        error: function (data) {
            console.info(data);
        },
    });
});


//When all players set names and characters you can start game as host
$("#start-game").click(()=> {
    $.ajax({
        xhrFields: { withCredentials: true },
        url: host + '/host_start_game',
        contentType: 'application/json; charset=utf-8',
        type: 'post',
        headers: {
            game_id: window.gameImIn.Id,

        },
        data: {
        },

        success: function (data) {
            console.info(data);
        },
        error: function (data) {
            console.info(data);
        },
    });
});

//Set character and name
$("#submit_character").click(()=>{
    $.ajax({
        xhrFields: { withCredentials: true },
        url: host + '/submit_character',
        contentType: 'application/json; charset=utf-8',
        type: 'post',
        headers: {
            game_id: window.gameImIn.Id,
            name: "Yuriy",
            character: "Mdambldor"
        },
        data: {
        },

        success: function (data) {
            console.info(data);
        },
        error: function (data) {
            console.info(data);
        },
    });
});

$("#set-win").click(()=>{
    $.ajax({
        xhrFields: { withCredentials: true },
        url: host + '/set_win',
        contentType: 'application/json; charset=utf-8',
        type: 'post',
        headers: {
            game_id: window.gameImIn.Id,
            user: null, //user id here
        },
        data: {
        },

        success: function (data) {

            console.info(data);
        },
        error: function (data) {
            console.info(data);
        },
    });
});