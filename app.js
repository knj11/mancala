const DEFAULT_BOARD = [
  /* player 1 */
  0,
  4,
  4,
  4,
  4,
  4,
  4,
  /* player 2 */
  0,
  4,
  4,
  4,
  4,
  4,
  4,
];

const stealLookUp = {
  pit_1: 13,
  pit_2: 12,
  pit_3: 11,
  pit_4: 10,
  pit_5: 9,
  pit_6: 8,
  pit_8: 6,
  pit_9: 5,
  pit_10: 4,
  pit_11: 3,
  pit_12: 2,
  pit_13: 1,
};

let endGameBool = false;

const gameState = {
  board: JSON.parse(localStorage.getItem("board")) || DEFAULT_BOARD, // from above
  currentPlayer: JSON.parse(localStorage.getItem("currentPlayer")) || 1, // switch to 2 when the player swaps
  player1: JSON.parse(localStorage.getItem("player1")) || "",
  player2: JSON.parse(localStorage.getItem("player2")) || "",
  activeGame: JSON.parse(localStorage.getItem("activeGame")) || false,
  isBot: JSON.parse(localStorage.getItem("isBot")) || false,
};

function storeGameState() {
  for (let property in gameState) {
    localStorage.setItem(`${property}`, JSON.stringify(gameState[property]));
  }
}

function playerMove(pitID) {
  let playerID = gameState.currentPlayer;
  let pitCount = gameState.board[pitID];
  let extraTurn;
  let lastMarbleSpotID;

  function isCurrentPlayerSpace(id) {
    if (id >= 1 && id <= 6 && playerID === 1) {
      return true;
    } else if (id >= 8 && id <= 13 && playerID === 2) {
      return true;
    } else {
      return false;
    }
  }

  function isEndGame() {
    let p1Pits = gameState.board.slice(1, 7);
    let p2Pits = gameState.board.slice(8, 14);
    let p1Sum = p1Pits.reduce((acc, el) => acc + el, 0);
    let p2Sum = p2Pits.reduce((acc, el) => acc + el, 0);

    if (p1Sum === 0) {
      //adds sum of Player 2 marbles into their Bowl and clears pits
      gameState.board[0] += p2Sum;
      for (let i = 8; i <= 13; i++) {
        gameState.board[i] = 0;
      }
      return true;
      //adds sum of Player 1 marbles into their Bowl and clears pits
    } else if (p2Sum === 0) {
      gameState.board[7] += p1Sum;
      for (let i = 1; i <= 6; i++) {
        gameState.board[i] = 0;
      }
      return true;
    } else {
      return false;
    }
  }

  //Clears the pit the was selected
  gameState.board[pitID] = 0;
  //Fetches the count and iteriates through that many marbles place 1 in each spot
  for (let i = 0; i < pitCount; i++) {
    pitID++;
    //resets rotation through the board
    if (pitID > 13) {
      pitID = 0;
    }

    /*logic so the player does not drop his marbel 
    into the Opponents Bowl during their move*/
    if (playerID === 1 && pitID === 0) {
      i--;
      continue;
    } else if (playerID === 2 && pitID === 7) {
      i--;
      continue;
    }

    gameState.board[pitID]++;

    lastMarbleSpotID = pitID;
  }

  //check marbleCount of last position
  if (
    gameState.board[lastMarbleSpotID] === 1 &&
    isCurrentPlayerSpace(lastMarbleSpotID)
  ) {
    let opponentPit = stealLookUp[`pit_${lastMarbleSpotID}`];
    if (gameState.board[opponentPit] !== 0) {
      let totalMarblesStolen =
        gameState.board[lastMarbleSpotID] + gameState.board[opponentPit];
      gameState.board[lastMarbleSpotID] = 0;
      gameState.board[opponentPit] = 0;
      playerID === 1
        ? (gameState.board[7] += totalMarblesStolen)
        : (gameState.board[0] += totalMarblesStolen);
    }
  }

  //checks if last marbel was placed in their bowl (Gives player extra turn)
  if (lastMarbleSpotID === 7 && playerID === 1) {
    extraTurn = true;
  } else if (lastMarbleSpotID === 0 && playerID === 2) {
    extraTurn = true;
  } else {
    extraTurn = false;
  }

  //logic to check if either players pits are empty (END GAME)
  if (isEndGame()) {
    endGameBool = true;
    //setting extraTurn to true will override setting current player to next value
    extraTurn = true;
  }

  //logic to check for an extra turn
  if (!extraTurn) {
    //switches players at the end of a turn
    gameState.currentPlayer === 1
      ? (gameState.currentPlayer = 2)
      : (gameState.currentPlayer = 1);
  }

  //Store gameState object in local Storage
  storeGameState();

  //Bot will decide next move
  if (gameState.isBot && gameState.currentPlayer === 2) {
    renderElements();
    setTimeout(botDecision, 1500);
  }
}

function botDecision() {
  // Bot's bowl is at index 0
  let bowlCount = gameState.board[0];
  //
  let botPits = gameState.board.slice(8, 14);
  let extraPickBool = false;
  let extraMovePick;
  let lastResortPick;

  let compareExtraMoveNum = 6;
  for (let idx = 8; idx < 14; idx++) {
    if (gameState.board[idx] === compareExtraMoveNum) {
      extraPickBool = true;
      extraMovePick = idx;
      break;
    }
    compareExtraMoveNum--;
  }


  for (let idx = 13; idx > 7; idx--) {
    if (gameState.board[idx] > 0) {
      lastResortPick = idx;
      break;
    }
  }

  (extraPickBool)
    ? playerMove(extraMovePick)
    : playerMove(lastResortPick);
  renderElements();
}

function renderElements() {
  function createMarble() {
    return $('<div class="marble">');
  }

  function updatePitCount(id, count) {
    $(`#pit-${id} .pit-count`).text(`${count}`);
  }

  function updatePlayerName() {
    gameState.currentPlayer === 1
      ? $(".player").text(gameState.player1)
      : $(".player").text(gameState.player2);
  }

  function toggleClickablePits() {
    $(".pit").removeClass("can-click");
    gameState.currentPlayer === 1
      ? $('[name="p1"]').addClass("can-click")
      : $('[name="p2"]').addClass("can-click");
  }

  $(".marbel-bucket").empty();
  //will loop over all the pits and give the id
  for (let pitID = 0; pitID < gameState.board.length; pitID++) {
    let pitCount = gameState.board[pitID];
    //update the display with the count
    updatePitCount(pitID, pitCount);
    for (let j = 0; j < pitCount; j++) {
      $(`#pit-${pitID} .marbel-bucket`).append(createMarble());
    }
  }

  if (endGameBool) {
    p1BowlCount = gameState.board[7]
    p2BowlCount = gameState.board[0]
    $(".end-game").addClass("open");
    $(".end-game .content").html(
      `<p>congratulations ${
        (p1BowlCount > p2BowlCount) ? gameState.player1 : gameState.player2
      } on winning the game</p>
      `
    );
  }

  updatePlayerName();
  toggleClickablePits();
}

function createPitLayout() {
  $("#game").children().append('<div class="pit-count">0</div>');
  $("#game").children().append('<div class="marbel-bucket"></div>');
}

/* //////////////////////
///BUTTON functionality//
//////////////////////*/

//Reset Game
$("#reset").click(function () {
  localStorage.clear();
  location.reload();
});

//Select opponent radio buttons
$("input[type=radio]").click((e) => {
  //toggles between vs player and vs bot
  let opponent = e.target.id;
  if (opponent === "bot") {
    $("#player2").val("Bot").attr("disabled", true);
  } else {
    $("#player2").val("").removeAttr("disabled");
  }
});

//Start Game button
$("#start").click(function (e) {
  e.preventDefault();

  let p1Name = $("#player1").val();
  let p2Name = $("#player2").val();

  if (p1Name === "" || p2Name === "") {
    alert("Please enter a name for Players");
  } else {
    gameState.activeGame = true;
    gameState.isBot = document.getElementById("bot").checked;
    gameState.player1 = p1Name;
    gameState.player2 = p2Name;
    $(".modal").removeClass("open");
    renderElements();
    storeGameState();
  }
});

//Player's Move Button
$(`.pit`).click(function () {
  //regex to return only digits from the pitID string
  let pitID = +$(this).attr("id").replace(/\D/g, "");
  let playerID = +$(this).attr("name").replace(/\D/g, "");

  if (playerID === gameState.currentPlayer) {
    playerMove(pitID);
    renderElements();
  }
});

createPitLayout();
renderElements();

if (gameState.activeGame === false) {
  $(".modal").addClass("open");
}
