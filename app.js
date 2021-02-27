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

const gameState = {
  board: JSON.parse(localStorage.getItem("board")) || DEFAULT_BOARD, // from above
  currentPlayer: 1, // switch to 2 when the player swaps
};

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

  gameState.board[pitID] = 0;
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
      (playerID === 1)
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

  //logic to check for an extra turn
  if (!extraTurn) {
    //switches players at the end of a turn
    gameState.currentPlayer === 1
      ? (gameState.currentPlayer = 2)
      : (gameState.currentPlayer = 1);
  }
}

function populateMarbles() {
  function createMarble() {
    return $('<div class="marble">');
  }

  function updatePitCount(id, count) {
    $(`#pit-${id} .pit-count`).text(`${count}`);
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
}

function createPitLayout() {
  $("#game").children().append('<div class="pit-count">0</div>');
  $("#game").children().append('<div class="marbel-bucket"></div>');
}

$(`.pit`).click(function () {
  //regex to return only digits from the pitID string
  let pitID = +$(this).attr("id").replace(/\D/g, "");
  let playerID = +$(this).attr("name").replace(/\D/g, "");

  if (playerID === gameState.currentPlayer) {
    playerMove(pitID);
    populateMarbles();
  }
});

createPitLayout();
populateMarbles();
