const passwordJoin = document.querySelector(".join__password");
const passwordField = document.querySelector(".create__password");

const mainScreen = document.querySelector(".create-game");
const hostLobbyScreen = document.querySelector(".host-lobby");
const playerLobbyScreen = document.querySelector(".player-lobby");
const hostGameScreen = document.querySelector(".host-game");
const playerGameScreen = document.querySelector(".player-game");

const playerName = document.querySelector(".player-name");
const playerCharacter = document.querySelector(".player-character");

const gameInput = document.getElementsByClassName("input-game");

let FIX_ID;
if (window.location.search.length) {
  FIX_ID = "asdasdasdasdasdasd";
} else {
  FIX_ID = "asdasdas";
}

let getGameInfo = (id, cb) => {
  $.ajax({
    url: host + "/game_info",
    contentType: "application/json; charset=utf-8",
    xhrFields: { withCredentials: true },
    type: "post",
    data: {},
    headers: {
      id_fix: FIX_ID,
      game_id: id,
    },
    success: function (data) {
      data = JSON.parse(data);
      if (cb) cb(data);
    },
    error: function (data) {},
  });
};

const host = "http://ec2-3-83-130-30.compute-1.amazonaws.com:8081";

function addUsersRow(
  tableID,
  name,
  charAssigned,
  userHost,
  started,
  wonStatus,
  userid
) {
  const tableRef = document.getElementById(tableID);
  const dataRow = tableRef.insertRow(1);
  $(dataRow).addClass("users-row");
  const nameCell = dataRow.insertCell(0);
  const characterCell = dataRow.insertCell(1);
  if (userid == window.MyId) {
    nameCell.innerHTML = `
    <div class='self__row flex a-center'>
      <div class='self__value'>${name}</div>
    </div>`;
    characterCell.innerHTML = `
    <div class='self__row flex a-center'>
      <div class='self__value'>${charAssigned}</div>
    </div>`;
    $(dataRow).addClass("my-row");
  } else {
    nameCell.innerHTML = name;
    characterCell.innerHTML = charAssigned;
  }

  console.log("started", started);
  if (!started) {
    console.log("length", $(".self__row .player-edit").length);
    if ($(".self__row .player-edit").length == 0) {
      $(".self__row").append(
        "<img class='player-edit' src='img/edit.svg' alt=''>"
      );
    }
  } else {
    console.log("remove");
    $(".player-edit").remove();
  }

  const winStatus = dataRow.insertCell(2);

  if (wonStatus === true) {
    $(dataRow).addClass("winner color-orange");
    winStatus.innerHTML = `Win`;
  } else {
    winStatus.innerHTML = `-`;
  }

  nameCell.classList.add("user");
  if (userHost) {
    nameCell.classList.add("userhost");
  }
  //if (userHost) {

  if (started && window.isHost && wonStatus === false) {
    $("");
    winStatus.innerHTML = `
    <label class="checkbox">
      <input class="checkbox__input" type="checkbox">
      <span class="checkbox__checkmark"></span>
    </label>
    `;
    $(".checkbox", $(".users-row")).click(() => {
      setWinFor(userid);
    });
  }
  //}
}

let globalUpdate = () => {
  getGameInfo(window.CurrentGame.Id, (data) => {
    redrawUsers(data);
    window.CurrentGame = data;
  });
};

let redrawUsers = (game) => {
  $(".users-row").remove();
  window.isHost = false;
  game.GameUsers.forEach((e) => {
    if (e.Id == window.MyId) {
      window.isHost = e.Host;
    }
  });

  if (game.Started || !window.isHost) {
    $(".team-link").hide();
  }

  if (window.isHost) {
    $("#menu").hide();
  } else {
    $("#start-game").remove();
    $("#menu").show();
    $("#finish").hide();
    $(".game-active .text-block").hide();
  }

  if (window.isHost && !game.Started) $("#start-game").show();
  else $("#start-game").hide();

  game.GameUsers.forEach((e) => {
    let name = e.Name;
    let charAssigned = "*****";
    if (window.MyId == "") {
      console.log("NO MY ID");
    }

    if (game.Started) {
      if (e.Won || e.Id != window.MyId) charAssigned = e.CharacterAssigned;
      else {
        charAssigned = "*****";
      }
    } else {
      if (e.Id == window.MyId) charAssigned = e.CharacterAdded;
    }
    addUsersRow(
      "js-player-lobby",
      name,
      charAssigned,
      e.Host,
      game.Started,
      e.Won,
      e.Id
    );
  });
};

let updateUserScreen = (data) => {
  window.CurrentGame = data;

  redrawUsers(window.CurrentGame);
  globalUpdate();

  setInterval(() => {
    globalUpdate();
  }, 1000);

  mainScreen.style.display = "none";
  playerLobbyScreen.style.display = "block";
};

const validateInput = (input, error) => {
  let inputParent = $(input).parent();
  if (inputParent.hasClass("error-input")) {
    inputParent.removeClass("error-input");
    inputParent.find(".error-text").remove();
  }
  if ($(input).val().trim() !== "") {
    return true;
  }
  inputParent.addClass("error-input");
  inputParent.append('<div class="error-text">' + error + "</div>");
  return false;
};

window.onload = (e) => {
  if (window.location.search.length) {
    let game = window.location.search.substr(1).split("=");
    console.log(game);
    console.log("window.CurrentGame", window.CurrentGame);
    if (game[1].length) {
      $.ajax({
        url: host + "/join_game",
        contentType: "application/json; charset=utf-8",
        xhrFields: { withCredentials: true },
        type: "post",
        headers: {
          game_id: game[1],
          id_fix: FIX_ID,
          pass: "123",
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
    }
  }

  $.ajax({
    url: host + "/login",
    contentType: "application/json; charset=utf-8",
    xhrFields: { withCredentials: true },
    type: "post",
    data: {},
    headers: {},
    success: function (data) {
      // TODO back
      // window.MyId = data;
      window.MyId = FIX_ID;
      console.log("MyId is set to", data);
    },
    error: function (data) {},
  });

  $.ajax({
    url: host + "/list_games",
    contentType: "application/json; charset=utf-8",
    xhrFields: { withCredentials: true },
    dataType: "json",
    type: "post",
    data: {},
    success: function (data) {
      let toJoin = data.ToJoin ? data.ToJoin : [];
      let myGames = data.GamesYoureIn ? data.GamesYoureIn : [];
      window.AllGames = toJoin.concat(myGames);
      if (data.GamesYoureIn) {
        data.GamesYoureIn.forEach((element) => {
          let gameName = element.PublicName;
          let gameId = element.Id;
          let users = element.GameUsers;
          element.ImIn = true;
          addRow("js-table", gameId, gameName, users, true);
        });

        $('input:radio[name="game"]').change(function () {
          gameId = $(this).attr("id");
          window.selectedGame = gameId;
          window.CurrentGame = window.AllGames.find((e) => {
            return e.Id == gameId;
          });
        });
      }

      if (data.ToJoin) {
        window.toJoin = data.ToJoin;
        data.ToJoin.forEach((element) => {
          let gameName = element.PublicName;
          let gameId = element.Id;
          let users = element.GameUsers;
          addRow("js-table", gameId, gameName, users);
        });

        $(".js-teams-num").text(data.ToJoin.length);

        $('input:radio[name="game"]').change(function () {
          gameId = $(this).attr("id");
          window.selectedGame = gameId;
          window.CurrentGame = window.AllGames.find((e) => {
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

  function addRow(tableID, gameId, gameName, users, mygames) {
    const tableRef = document.getElementById(tableID);
    const joinRow = tableRef.insertRow(1);
    const joinCellName = joinRow.insertCell(0);
    const joinCellNum = joinRow.insertCell(1);
    joinCellNum.innerHTML = users.length;
    joinCellName.innerHTML = gameName;
    // joinCellName.innerHTML = `<input id="${gameId}" class="input-game" type="radio" name="game" value="${gameId}">
    // <label for="${gameId}" class="select-game">${gameName}</label>`;
    // if (mygames) joinCellName.setAttribute("style", "background-color: orange");
  }
};

$("#join-game").click(() => {
  if (!window.CurrentGame) {
    $("#select-game").show(0);
    setTimeout(() => {
      $("#select-game").hide(150);
    }, 2000);
    return;
  }

  if (window.CurrentGame && window.CurrentGame.ImIn) {
    updateUserScreen(window.CurrentGame);
  } else if (passwordJoin.value != "" && window.selectedGame) {
    $.ajax({
      url: host + "/join_game",
      contentType: "application/json; charset=utf-8",
      xhrFields: { withCredentials: true },
      type: "post",
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
    alert("Please, enter your password");
  }
});

$("#create-game").click(() => {
  if (!validateInput(".create-name", "Enter name")) {
    return false;
  }
  $.ajax({
    url: host + "/create_game",
    contentType: "application/json; charset=utf-8",
    xhrFields: { withCredentials: true },
    type: "post",
    data: {},
    headers: {
      id_fix: FIX_ID,
      pass: "123",
      name: $("create-name").val(),
    },
    success: function (data) {
      console.log(data);
      mainScreen.style.display = "none";
      playerLobbyScreen.style.display = "block";
      data = JSON.parse(data);
      updateUserScreen(data);
      let teamLink = location.origin + "?game_id=" + data.LinkToken;
      $(".team-link a").attr("href", teamLink).html(teamLink);
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
      winStatus.innerHTML = "Win";
    } else {
      winStatus.innerHTML = "";
    }

    if (userHost) {
      nameCell.classList.add("user");
    }
  }
});

// host lobby script
$("#start-game").click(() => {
  $.ajax({
    url: host + "/host_start_game",
    contentType: "application/json; charset=utf-8",
    xhrFields: { withCredentials: true },
    type: "post",
    data: {},
    headers: {
      id_fix: FIX_ID,
      game_id: window.CurrentGame.Id,
    },
    success: function (data) {
      $(".player-info").slideUp();
      $(".game-active ").slideDown();
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
});

// player lobby script
$("#submit_character").click(() => {
  if (
    !validateInput(".player-name", "Enter name") ||
    !validateInput(".player-character", "Enter character")
  ) {
    return false;
  }
  $.ajax({
    url: host + "/submit_character",
    contentType: "application/json; charset=utf-8",
    xhrFields: { withCredentials: true },
    type: "post",
    headers: {
      id_fix: FIX_ID,
      game_id: window.CurrentGame.Id,
      name: playerName.value,
      character: playerCharacter.value,
    },
    data: {},
    success: function (data) {
      globalUpdate();
      console.info(data);
      $(".player-info__form").slideUp();
      $(".player-info__alert").slideDown();
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
});

let setWinFor = (id) => {
  $.ajax({
    url: host + "/set_win",
    contentType: "application/json; charset=utf-8",
    xhrFields: { withCredentials: true },
    type: "post",
    headers: {
      id_fix: FIX_ID,
      game_id: window.CurrentGame.Id,
      user: id,
    },
    data: {},
    success: function (data) {
      console.info(data);
      globalUpdate();
    },
    error: function (data) {
      console.info(data);
    },
  });
};

$("#menu").click(() => {
  window.open("./", (target = "_self"));
});

$("#finish").click(() => {
  $.ajax({
    url: host + "/finish_game",
    contentType: "application/json; charset=utf-8",
    xhrFields: { withCredentials: true },
    type: "post",
    headers: {
      id_fix: FIX_ID,
      game_id: window.CurrentGame.Id,
    },
    data: {},
    success: function (data) {
      console.info(data);
      globalUpdate();
    },
    error: function (data) {
      console.info(data);
    },
  });

  window.open("./", (target = "_self"));
});

$(".player-info__form input").keyup(function () {
  let parent = $(this).parents(".player-info");
  let error = false;
  console.log(parent);
  console.log($("input", parent));
  $("input", parent).each((index, el) => {
    if (el.value == "") {
      error = true;
    }
  });

  if (!error) {
    $(".btn", parent).removeClass("disabled");
  } else {
    $(".btn", parent).addClass("disabled");
  }
});

$(document).on("click", ".self__row .player-edit", function () {
  $(".player-info__form").slideDown();
  $(".player-info__alert").slideUp();
});

$(".team-link__copy, .team-link a").click(function (e) {
  e.preventDefault();
  copyToClipboard($(".team-link a")[0]);
  let prevText = $(this).text();
  $(this).html("Copied");
  setTimeout(() => {
    $(this).html(prevText);
  }, 900);
});

function copyToClipboard(elem) {
  // create hidden text element, if it doesn't already exist
  var targetId = "_hiddenCopyText_";
  var isInput = elem.tagName === "INPUT" || elem.tagName === "TEXTAREA";
  var origSelectionStart, origSelectionEnd;
  if (isInput) {
    // can just use the original source element for the selection and copy
    target = elem;
    origSelectionStart = elem.selectionStart;
    origSelectionEnd = elem.selectionEnd;
  } else {
    // must use a temporary form element for the selection and copy
    target = document.getElementById(targetId);
    if (!target) {
      var target = document.createElement("textarea");
      target.style.position = "absolute";
      target.style.left = "-9999px";
      target.style.top = "0";
      target.id = targetId;
      document.body.appendChild(target);
    }
    target.textContent = elem.textContent;
  }
  // select the content
  var currentFocus = document.activeElement;
  target.focus();
  target.setSelectionRange(0, target.value.length);

  // copy the selection
  var succeed;
  try {
    succeed = document.execCommand("copy");
  } catch (e) {
    succeed = false;
  }
  // restore original focus
  if (currentFocus && typeof currentFocus.focus === "function") {
    currentFocus.focus();
  }

  if (isInput) {
    // restore prior selection
    elem.setSelectionRange(origSelectionStart, origSelectionEnd);
  } else {
    // clear temporary content
    target.textContent = "";
  }
  return succeed;
}
