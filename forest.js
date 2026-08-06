const MONSTER_LIST = [
  {
    name: "티거",
    img: "./2112.png"
  }
];

const CHEST_REWARDS = [
  "100 골드",
  "체력 회복 포션",
  "마나 회복 포션",
  "낡은 숲의 열쇠",
  "희귀한 버섯"
];

let forestGame = {
  depth: 0,
  currentRoom: null,
  roomHistory: [],
  screen: null,
  player: null,
  playerX: 50,
  playerY: 50,
  keys: {},
  animationId: null,
  forestNumber: null,
  shelterName: "",
  nearObject: null
};

function escapeHtml(text) {
  if (text === null || text === undefined) return "";

  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getOppositeDirection(direction) {
  const opposite = {
    left: "right",
    right: "left",
    up: "down",
    down: "up"
  };

  return opposite[direction] || null;
}

function createForestRoom(parentDirection, isSpecialTreeRoom = false) {
  const room = {
    parentDirection,
    exits: {
      left: false,
      right: false,
      up: false,
      down: false
    },
    connections: {
      left: null,
      right: null,
      up: null,
      down: null
    },
    tree: null,
    chest: null,
    specialTreeDirection: null
  };

  const opposite = getOppositeDirection(parentDirection);

  if (opposite) {
    room.exits[opposite] = true;
  }

  const directions = ["left", "right", "up", "down"];
  const availableDirections = [];

  for (const direction of directions) {
    if (direction === opposite) continue;

    if (Math.random() < 0.25) {
      room.exits[direction] = true;
      availableDirections.push(direction);
    }
  }

  if (availableDirections.length > 0) {
    room.specialTreeDirection =
      availableDirections[
        Math.floor(Math.random() * availableDirections.length)
      ];
  }

  if (isSpecialTreeRoom) {
    room.tree = {
      x: 50,
      y: 50,
      visited: false
    };
  }

  if (parentDirection !== null && Math.random() < 0.35) {
    const corners = [
      { x: 12, y: 12 },
      { x: 88, y: 12 },
      { x: 12, y: 88 },
      { x: 88, y: 88 }
    ];

    const corner =
      corners[Math.floor(Math.random() * corners.length)];

    room.chest = {
      x: corner.x,
      y: corner.y,
      opened: false
    };
  }

  return room;
}

function createFirstForestRoom() {
  const room = {
    parentDirection: null,

    exits: {
      left: true,
      right: true,
      up: true,
      down: false
    },

    connections: {
      left: null,
      right: null,
      up: null,
      down: null
    },

    tree: null,
    chest: null,
    specialTreeDirection: null
  };

  const directions = ["left", "right", "up"];

  room.specialTreeDirection =
    directions[Math.floor(Math.random() * directions.length)];

  return room;
}

function enterForest(forestNumber, shelterName) {
  if (forestGame.screen) {
    exitForestGame();
  }

  forestGame.depth = 0;
  forestGame.currentRoom = createFirstForestRoom();
  forestGame.roomHistory = [];
  forestGame.playerX = 50;
  forestGame.playerY = 50;
  forestGame.forestNumber = forestNumber;
  forestGame.shelterName = shelterName;
  forestGame.nearObject = null;
  forestGame.keys = {};

  const screen = document.createElement("div");

  screen.id = "forest-game-screen";

  screen.innerHTML = `
    <div class="forest-game">

      <div class="forest-header">
        <div>
          <strong>숲 ${escapeHtml(forestNumber)}</strong>
          <span>${escapeHtml(shelterName)}</span>
        </div>

        <button
          type="button"
          class="forest-exit-button"
          id="forest-exit-button"
        >
          지도으로 돌아가기
        </button>
      </div>

      <div id="forest-room" class="forest-room">

        <div
          id="forest-up"
          class="forest-entrance forest-up"
        ></div>

        <div
          id="forest-left"
          class="forest-entrance forest-left"
        ></div>

        <div
          id="forest-right"
          class="forest-entrance forest-right"
        ></div>

        <div
          id="forest-down"
          class="forest-entrance forest-down"
        ></div>

        <div
          id="forest-tree"
          class="forest-object forest-tree"
          style="display:none;"
        >
          🌳
        </div>

        <div
          id="forest-chest"
          class="forest-object forest-chest"
          style="display:none;"
        >
          🎁
        </div>

        <div
          id="forest-player"
          class="forest-player"
        ></div>

      </div>

      <div
        id="forest-message"
        class="forest-message"
      >
        방향키로 이동하십시오.
      </div>

      <div
        id="forest-modal"
        class="forest-modal"
        style="display:none;"
      >
        <div
          class="forest-modal-content"
        >
          <img
            id="modal-img"
            src=""
            alt="획득 이미지"
            class="modal-img"
          />

          <div
            id="modal-text"
            class="modal-text"
          ></div>

          <button
            type="button"
            id="modal-close-button"
            class="modal-close-btn"
          >
            확인
          </button>
        </div>
      </div>

    </div>
  `;

  document.body.appendChild(screen);

  forestGame.screen = screen;
  forestGame.player =
    screen.querySelector("#forest-player");

  const exitButton =
    screen.querySelector("#forest-exit-button");

  const tree =
    screen.querySelector("#forest-tree");

  const chest =
    screen.querySelector("#forest-chest");

  const closeButton =
    screen.querySelector("#modal-close-button");

  exitButton.addEventListener("click", exitForestGame);
  tree.addEventListener("click", interactTree);
  chest.addEventListener("click", interactChest);
  closeButton.addEventListener("click", closeModal);

  addForestGameStyle();
  startForestKeyboard();
  renderForestRoom();
  forestGameLoop();
}

function renderForestRoom() {
  const room = forestGame.currentRoom;

  if (!room || !forestGame.screen) return;

  const up =
    forestGame.screen.querySelector("#forest-up");

  const left =
    forestGame.screen.querySelector("#forest-left");

  const right =
    forestGame.screen.querySelector("#forest-right");

  const down =
    forestGame.screen.querySelector("#forest-down");

  const treeEl =
    forestGame.screen.querySelector("#forest-tree");

  const chestEl =
    forestGame.screen.querySelector("#forest-chest");

  up.style.display =
    room.exits.up ? "block" : "none";

  left.style.display =
    room.exits.left ? "block" : "none";

  right.style.display =
    room.exits.right ? "block" : "none";

  down.style.display =
    room.exits.down ? "block" : "none";

  if (room.tree) {
    treeEl.style.left = room.tree.x + "%";
    treeEl.style.top = room.tree.y + "%";
    treeEl.style.display = "block";

    if (room.tree.visited) {
      treeEl.classList.add("forest-tree-visited");
    } else {
      treeEl.classList.remove("forest-tree-visited");
    }
  } else {
    treeEl.style.display = "none";
  }

  if (room.chest) {
    chestEl.style.left = room.chest.x + "%";
    chestEl.style.top = room.chest.y + "%";
    chestEl.innerText =
      room.chest.opened ? "📦" : "🎁";
    chestEl.style.display = "block";
  } else {
    chestEl.style.display = "none";
  }

  updateForestBackground();
  updatePlayerPosition();
  checkObjectProximity();
}

function updateForestBackground() {
  if (!forestGame.screen) return;

  const game =
    forestGame.screen.querySelector(".forest-game");

  if (!game) return;

  game.classList.remove(
    "forest-normal-bg",
    "forest-deep-bg"
  );

  if (forestGame.depth === 0) {
    game.classList.add("forest-normal-bg");
  } else {
    game.classList.add("forest-deep-bg");
  }
}

function startForestKeyboard() {
  stopForestKeyboard();

  window.addEventListener(
    "keydown",
    forestKeyDown,
    true
  );

  window.addEventListener(
    "keyup",
    forestKeyUp,
    true
  );
}

function stopForestKeyboard() {
  window.removeEventListener(
    "keydown",
    forestKeyDown,
    true
  );

  window.removeEventListener(
    "keyup",
    forestKeyUp,
    true
  );

  forestGame.keys = {};
}

function forestKeyDown(event) {
  if (!forestGame.screen) return;

  const allowedKeys = [
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "Shift"
  ];

  if (!allowedKeys.includes(event.key)) return;

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();

  if (event.key === "Shift") {
    if (!event.repeat) {
      checkObjectProximity();
      checkInteraction();
    }

    return;
  }

  forestGame.keys[event.key] = true;
}

function forestKeyUp(event) {
  if (!forestGame.screen) return;

  const allowedKeys = [
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight"
  ];

  if (!allowedKeys.includes(event.key)) return;

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();

  forestGame.keys[event.key] = false;
}

function forestGameLoop() {
  if (!forestGame.screen) return;

  movePlayer();
  updatePlayerPosition();
  checkObjectProximity();

  forestGame.animationId =
    requestAnimationFrame(forestGameLoop);
}

function movePlayer() {
  const speed = 0.45;
  let moved = false;

  if (forestGame.keys["ArrowUp"]) {
    forestGame.playerY -= speed;
    moved = true;
  }

  if (forestGame.keys["ArrowDown"]) {
    forestGame.playerY += speed;
    moved = true;
  }

  if (forestGame.keys["ArrowLeft"]) {
    forestGame.playerX -= speed;
    moved = true;
  }

  if (forestGame.keys["ArrowRight"]) {
    forestGame.playerX += speed;
    moved = true;
  }

  if (moved) {
    checkForestBoundary();
  }
}

function updatePlayerPosition() {
  if (!forestGame.player) return;

  forestGame.player.style.left =
    forestGame.playerX + "%";

  forestGame.player.style.top =
    forestGame.playerY + "%";
}

function checkObjectProximity() {
  const room = forestGame.currentRoom;

  if (!room || !forestGame.screen) return;

  const message =
    forestGame.screen.querySelector("#forest-message");

  if (!message) return;

  const threshold = 13;

  let near = null;

  if (room.tree && !room.tree.visited) {
    const distance =
      Math.hypot(
        forestGame.playerX - room.tree.x,
        forestGame.playerY - room.tree.y
      );

    if (distance < threshold) {
      near = "tree";
    }
  }

  if (
    !near &&
    room.chest &&
    !room.chest.opened
  ) {
    const distance =
      Math.hypot(
        forestGame.playerX - room.chest.x,
        forestGame.playerY - room.chest.y
      );

    if (distance < threshold) {
      near = "chest";
    }
  }

  forestGame.nearObject = near;

  if (near === "tree") {
    message.innerText =
      "[Shift] 또는 클릭하여 나무 조사하기";

    message.classList.add("highlight");

  } else if (near === "chest") {
    message.innerText =
      "[Shift] 또는 클릭하여 보물상자 열기";

    message.classList.add("highlight");

  } else {
    message.innerText =
      "방향키로 이동하십시오.";

    message.classList.remove("highlight");
  }
}

function checkInteraction() {
  if (forestGame.nearObject === "tree") {
    interactTree();
    return;
  }

  if (forestGame.nearObject === "chest") {
    interactChest();
  }
}

function interactTree() {
  const room = forestGame.currentRoom;

  if (
    !room ||
    !room.tree ||
    room.tree.visited
  ) {
    return;
  }

  const randomIndex =
    Math.floor(
      Math.random() * MONSTER_LIST.length
    );

  const monster =
    MONSTER_LIST[randomIndex];

  room.tree.visited = true;

  forestGame.nearObject = null;

  showModal(
    monster.img,
    `"${monster.name}"을(를) 획득했다!`
  );

  checkObjectProximity();
}

function interactChest() {
  const room = forestGame.currentRoom;

  if (
    !room ||
    !room.chest ||
    room.chest.opened
  ) {
    return;
  }

  room.chest.opened = true;

  const randomIndex =
    Math.floor(
      Math.random() * CHEST_REWARDS.length
    );

  const reward =
    CHEST_REWARDS[randomIndex];

  showModal(
    "",
    `보물상자에서 [${reward}]을(를) 획득했습니다!`
  );

  checkObjectProximity();
}

function showModal(imgUrl, text) {
  if (!forestGame.screen) return;

  const modal =
    forestGame.screen.querySelector("#forest-modal");

  const modalImg =
    forestGame.screen.querySelector("#modal-img");

  const modalText =
    forestGame.screen.querySelector("#modal-text");

  if (!modal || !modalImg || !modalText) return;

  if (imgUrl) {
    modalImg.src = imgUrl;
    modalImg.style.display = "block";
  } else {
    modalImg.removeAttribute("src");
    modalImg.style.display = "none";
  }

  modalText.innerText = text;
  modal.style.display = "flex";
}

function closeModal() {
  if (!forestGame.screen) return;

  const modal =
    forestGame.screen.querySelector("#forest-modal");

  if (modal) {
    modal.style.display = "none";
  }
}

function checkForestBoundary() {
  const edge = 5;
  const room = forestGame.currentRoom;

  if (!room) return;

  if (forestGame.playerY <= edge) {
    forestGame.playerY = edge;

    if (room.exits.up) {
      handleDirection("up");
      return;
    }
  }

  if (forestGame.playerY >= 100 - edge) {
    forestGame.playerY = 100 - edge;

    if (room.exits.down) {
      handleDirection("down");
      return;
    }

    if (forestGame.depth === 0) {
      exitForestGame();
      return;
    }
  }

  if (forestGame.playerX <= edge) {
    forestGame.playerX = edge;

    if (room.exits.left) {
      handleDirection("left");
      return;
    }
  }

  if (forestGame.playerX >= 100 - edge) {
    forestGame.playerX = 100 - edge;

    if (room.exits.right) {
      handleDirection("right");
      return;
    }
  }
}

function handleDirection(direction) {
  const room = forestGame.currentRoom;

  if (!room) return;

  if (room.connections[direction]) {
    moveToExistingRoom(direction);
    return;
  }

  enterDeeperForest(direction);
}

function enterDeeperForest(direction) {
  const currentRoom =
    forestGame.currentRoom;

  if (!currentRoom) return;

  forestGame.keys = {};

  const isSpecialTreeRoom =
    currentRoom.specialTreeDirection === direction;

  const newRoom =
    createForestRoom(
      direction,
      isSpecialTreeRoom
    );

  currentRoom.connections[direction] =
    newRoom;

  const opposite =
    getOppositeDirection(direction);

  if (opposite) {
    newRoom.connections[opposite] =
      currentRoom;
  }

  forestGame.roomHistory.push(
    currentRoom
  );

  forestGame.depth++;

  forestGame.currentRoom =
    newRoom;

  setPlayerEntrancePosition(direction);

  renderForestRoom();
}

function moveToExistingRoom(direction) {
  const currentRoom =
    forestGame.currentRoom;

  if (!currentRoom) return;

  const targetRoom =
    currentRoom.connections[direction];

  if (!targetRoom) return;

  forestGame.keys = {};

  const opposite =
    getOppositeDirection(direction);

  if (
    targetRoom ===
    currentRoom.connections[direction] &&
    targetRoom.parentDirection === direction
  ) {
    forestGame.roomHistory.push(
      currentRoom
    );

    forestGame.depth++;

  } else {

    if (forestGame.roomHistory.length > 0) {
      forestGame.roomHistory.pop();
    }

    forestGame.depth--;

    if (forestGame.depth < 0) {
      forestGame.depth = 0;
    }
  }

  forestGame.currentRoom =
    targetRoom;

  setPlayerEntrancePosition(opposite);

  renderForestRoom();
}

function setPlayerEntrancePosition(direction) {
  if (direction === "up") {
    forestGame.playerX = 50;
    forestGame.playerY = 90;
    return;
  }

  if (direction === "down") {
    forestGame.playerX = 50;
    forestGame.playerY = 10;
    return;
  }

  if (direction === "left") {
    forestGame.playerX = 90;
    forestGame.playerY = 50;
    return;
  }

  if (direction === "right") {
    forestGame.playerX = 10;
    forestGame.playerY = 50;
  }
}

function exitForestGame() {
  stopForestKeyboard();

  if (forestGame.animationId) {
    cancelAnimationFrame(
      forestGame.animationId
    );

    forestGame.animationId = null;
  }

  if (forestGame.screen) {
    forestGame.screen.remove();
    forestGame.screen = null;
  }

  forestGame.player = null;
  forestGame.currentRoom = null;
  forestGame.roomHistory = [];
  forestGame.depth = 0;
  forestGame.playerX = 50;
  forestGame.playerY = 50;
  forestGame.keys = {};
  forestGame.forestNumber = null;
  forestGame.shelterName = "";
  forestGame.nearObject = null;
}

function addForestGameStyle() {
  if (
    document.getElementById(
      "forest-game-style"
    )
  ) {
    return;
  }

  const style =
    document.createElement("style");

  style.id =
    "forest-game-style";

  style.innerHTML = `
    #forest-game-screen {
      position: fixed;
      inset: 0;
      z-index: 9999;
      width: 100vw;
      height: 100vh;
      color: white;
      font-family: sans-serif;
    }

    .forest-game {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    }

    .forest-normal-bg {
      background-image: url("./forest-normal.png");
    }

    .forest-deep-bg {
      background-image: url("./forest-deep.png");
    }

    .forest-header {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      box-sizing: border-box;
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 10;
      background: rgba(0, 0, 0, 0.45);
    }

    .forest-header strong {
      display: block;
      font-size: 20px;
    }

    .forest-header span {
      display: block;
      margin-top: 3px;
      font-size: 12px;
      color: #c9d0c6;
    }

    .forest-exit-button {
      border: none;
      border-radius: 8px;
      padding: 8px 13px;
      background: rgba(255, 255, 255, 0.15);
      color: white;
      cursor: pointer;
      font-size: 13px;
    }

    .forest-exit-button:hover {
      background: rgba(255, 255, 255, 0.25);
    }

    .forest-room {
      position: absolute;
      left: 0;
      right: 0;
      top: 55px;
      bottom: 45px;
      overflow: hidden;
    }

    .forest-entrance {
      position: absolute;
      background: rgba(0, 0, 0, 0.45);
      box-shadow:
        inset 0 0 30px rgba(0, 0, 0, 0.85),
        0 0 25px rgba(0, 0, 0, 0.3);
      pointer-events: none;
      z-index: 2;
    }

    .forest-up {
      left: 50%;
      top: 2%;
      width: 160px;
      height: 80px;
      transform: translateX(-50%);
      border-radius: 80px 80px 0 0;
    }

    .forest-left {
      left: 2%;
      top: 50%;
      width: 80px;
      height: 160px;
      transform: translateY(-50%);
      border-radius: 0 80px 80px 0;
    }

    .forest-right {
      right: 2%;
      top: 50%;
      width: 80px;
      height: 160px;
      transform: translateY(-50%);
      border-radius: 80px 0 0 80px;
    }

    .forest-down {
      left: 50%;
      bottom: 2%;
      width: 160px;
      height: 80px;
      transform: translateX(-50%);
      border-radius: 0 0 80px 80px;
    }

    .forest-object {
      position: absolute;
      font-size: 42px;
      transform: translate(-50%, -50%);
      cursor: pointer;
      z-index: 4;
      user-select: none;
      transition: transform 0.2s;
    }

    .forest-object:hover {
      transform: translate(-50%, -50%) scale(1.2);
    }

    .forest-tree-visited {
      opacity: 0.55;
    }

    .forest-player {
      position: absolute;
      width: 30px;
      height: 30px;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      background: white;
      border: 3px solid #111;
      box-sizing: border-box;
      z-index: 5;
      box-shadow: 0 0 12px rgba(255, 255, 255, 0.5);
    }

    .forest-message {
      position: absolute;
      left: 50%;
      bottom: 12px;
      transform: translateX(-50%);
      z-index: 10;
      padding: 7px 13px;
      border-radius: 8px;
      background: rgba(0, 0, 0, 0.55);
      color: #e5e5e5;
      font-size: 12px;
      pointer-events: none;
      white-space: nowrap;
      transition: all 0.2s;
    }

    .forest-message.highlight {
      background: rgba(255, 193, 7, 0.9);
      color: #111;
      font-weight: bold;
    }

    .forest-modal {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.72);
      z-index: 100;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .forest-modal-content {
      background: #2a3a27;
      border: 2px solid #81c784;
      padding: 24px;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.8);
      max-width: 280px;
      width: 80%;
    }

    .modal-img {
      width: 120px;
      height: 120px;
      object-fit: contain;
      border-radius: 8px;
      margin-bottom: 12px;
      border: 2px solid white;
    }

    .modal-text {
      font-size: 15px;
      font-weight: bold;
      color: white;
      margin-bottom: 16px;
    }

    .modal-close-btn {
      background: #81c784;
      color: #111;
      border: none;
      padding: 8px 18px;
      border-radius: 6px;
      font-weight: bold;
      cursor: pointer;
    }

    .modal-close-btn:hover {
      background: #a5d6a7;
    }
  `;

  document.head.appendChild(style);
}

console.log("forest.js 로드 성공");
