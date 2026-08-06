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
  nearObject: null,

  treeSpawned: false
};

function escapeHtml(text) {
  if (text === null || text === undefined) {
    return "";
  }

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

function createForestRoom(parentDirection, isTreeRoom = false) {

  const room = {

    parentDirection: parentDirection,

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

  const opposite =
    getOppositeDirection(parentDirection);

  if (opposite) {
    room.exits[opposite] = true;
  }

  const deeperForestProbability = 0.25;

  const possibleDirections = [
    "left",
    "right",
    "up",
    "down"
  ];

  const availableDirections = [];

  for (const direction of possibleDirections) {

    if (direction === opposite) {
      continue;
    }

    if (Math.random() < deeperForestProbability) {

      room.exits[direction] = true;

      availableDirections.push(direction);
    }
  }

  if (availableDirections.length > 0) {

    const randomIndex =
      Math.floor(
        Math.random() *
        availableDirections.length
      );

    room.specialTreeDirection =
      availableDirections[randomIndex];
  }

  if (isTreeRoom) {

    room.tree = {
      x: 50,
      y: 50,
      visited: false
    };
  }

  if (
    parentDirection !== null &&
    Math.random() < 0.35
  ) {

    const corners = [
      { x: 12, y: 12 },
      { x: 88, y: 12 },
      { x: 12, y: 88 },
      { x: 88, y: 88 }
    ];

    const selectedCorner =
      corners[
        Math.floor(
          Math.random() *
          corners.length
        )
      ];

    room.chest = {
      x: selectedCorner.x,
      y: selectedCorner.y,
      opened: false
    };
  }

  return room;
}

function createFirstForestRoom() {

  const firstRoom = {

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

  const directions = [
    "left",
    "right",
    "up"
  ];

  firstRoom.specialTreeDirection =
    directions[
      Math.floor(
        Math.random() *
        directions.length
      )
    ];

  return firstRoom;
}

function enterForest(forestNumber, shelterName) {

  console.log(
    "숲 탐험 시작:",
    forestNumber,
    shelterName
  );

  if (forestGame.screen) {
    exitForestGame();
  }

  forestGame.depth = 0;
  forestGame.roomHistory = [];

  forestGame.playerX = 50;
  forestGame.playerY = 50;

  forestGame.forestNumber = forestNumber;
  forestGame.shelterName = shelterName;
  forestGame.nearObject = null;

  forestGame.treeSpawned = false;

  forestGame.currentRoom =
    createFirstForestRoom();

  const screen =
    document.createElement("div");

  screen.id =
    "forest-game-screen";

  screen.innerHTML = `

    <div class="forest-game">

      <div class="forest-header">

        <div>

          <strong>
            숲 ${escapeHtml(forestNumber)}
          </strong>

          <span>
            ${escapeHtml(shelterName)}
          </span>

        </div>

        <button
          type="button"
          class="forest-exit-button"
          onclick="exitForestGame()"
        >
          지도으로 돌아가기
        </button>

      </div>

      <div
        id="forest-room"
        class="forest-room"
      >

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
          onclick="interactTree()"
          style="display:none;"
        >
          🌳
        </div>

        <div
          id="forest-chest"
          class="forest-object forest-chest"
          onclick="interactChest()"
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
        onclick="closeModal()"
      >

        <div
          class="forest-modal-content"
          onclick="event.stopPropagation()"
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
            class="modal-close-btn"
            onclick="closeModal()"
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
    document.getElementById(
      "forest-player"
    );

  addForestGameStyle();

  startForestKeyboard();

  renderForestRoom();

  forestGameLoop();
}

function renderForestRoom() {

  const room =
    forestGame.currentRoom;

  if (!room) {
    return;
  }

  const forestRoom =
    document.getElementById(
      "forest-room"
    );

  if (forestRoom) {

    forestRoom.classList.toggle(
      "forest-normal",
      forestGame.depth === 0
    );

    forestRoom.classList.toggle(
      "forest-deep",
      forestGame.depth > 0
    );
  }

  const up =
    document.getElementById("forest-up");

  const left =
    document.getElementById("forest-left");

  const right =
    document.getElementById("forest-right");

  const down =
    document.getElementById("forest-down");

  if (up) {
    up.style.display =
      room.exits.up ? "block" : "none";
  }

  if (left) {
    left.style.display =
      room.exits.left ? "block" : "none";
  }

  if (right) {
    right.style.display =
      room.exits.right ? "block" : "none";
  }

  if (down) {
    down.style.display =
      room.exits.down ? "block" : "none";
  }

  const treeEl =
    document.getElementById(
      "forest-tree"
    );

  if (treeEl) {

    if (room.tree) {

      treeEl.style.left =
        room.tree.x + "%";

      treeEl.style.top =
        room.tree.y + "%";

      treeEl.style.display =
        "block";

    } else {

      treeEl.style.display =
        "none";
    }
  }

  const chestEl =
    document.getElementById(
      "forest-chest"
    );

  if (chestEl) {

    if (room.chest) {

      chestEl.style.left =
        room.chest.x + "%";

      chestEl.style.top =
        room.chest.y + "%";

      chestEl.innerText =
        room.chest.opened
          ? "📦"
          : "🎁";

      chestEl.style.display =
        "block";

    } else {

      chestEl.style.display =
        "none";
    }
  }

  updatePlayerPosition();

  checkObjectProximity();
}

function startForestKeyboard() {

  stopForestKeyboard();

  document.addEventListener(
    "keydown",
    forestKeyDown
  );

  document.addEventListener(
    "keyup",
    forestKeyUp
  );
}

function stopForestKeyboard() {

  document.removeEventListener(
    "keydown",
    forestKeyDown
  );

  document.removeEventListener(
    "keyup",
    forestKeyUp
  );

  forestGame.keys = {};
}

function forestKeyDown(event) {

  if (!forestGame.screen) {
    return;
  }

  const allowedKeys = [
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "Shift"
  ];

  if (!allowedKeys.includes(event.key)) {
    return;
  }

  event.preventDefault();

  forestGame.keys[event.key] = true;

  if (event.key === "Shift") {
    checkInteraction();
  }
}

function forestKeyUp(event) {

  const allowedKeys = [
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "Shift"
  ];

  if (allowedKeys.includes(event.key)) {

    forestGame.keys[event.key] =
      false;
  }
}

function forestGameLoop() {

  if (!forestGame.screen) {
    return;
  }

  movePlayer();

  updatePlayerPosition();

  checkObjectProximity();

  forestGame.animationId =
    requestAnimationFrame(
      forestGameLoop
    );
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

  if (!forestGame.player) {
    return;
  }

  forestGame.player.style.left =
    forestGame.playerX + "%";

  forestGame.player.style.top =
    forestGame.playerY + "%";
}

function checkObjectProximity() {

  const room =
    forestGame.currentRoom;

  const message =
    document.getElementById(
      "forest-message"
    );

  if (!room || !message) {
    return;
  }

  const threshold = 8;

  let near = null;

  if (room.tree) {

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
      "[Shift 키] 또는 [클릭]하여 나무 조사하기";

    message.classList.add(
      "highlight"
    );

  } else if (near === "chest") {

    message.innerText =
      "[Shift 키] 또는 [클릭]하여 보물상자 열기";

    message.classList.add(
      "highlight"
    );

  } else {

    message.innerText =
      "방향키로 이동하십시오.";

    message.classList.remove(
      "highlight"
    );
  }
}

function checkInteraction() {

  if (
    forestGame.nearObject ===
    "tree"
  ) {

    interactTree();

  } else if (
    forestGame.nearObject ===
    "chest"
  ) {

    interactChest();
  }
}

function interactTree() {

  const room =
    forestGame.currentRoom;

  if (!room || !room.tree) {
    return;
  }

  if (room.tree.visited) {
    return;
  }

  room.tree.visited = true;

  const randomIndex =
    Math.floor(
      Math.random() *
      MONSTER_LIST.length
    );

  const monster =
    MONSTER_LIST[randomIndex];

  showModal(
    monster.img,
    `"${monster.name}"을(를) 획득했다!`
  );
}

function interactChest() {

  const room =
    forestGame.currentRoom;

  if (
    !room ||
    !room.chest ||
    room.chest.opened
  ) {
    return;
  }

  room.chest.opened = true;

  const chestEl =
    document.getElementById(
      "forest-chest"
    );

  if (chestEl) {
    chestEl.innerText = "📦";
  }

  const randomIndex =
    Math.floor(
      Math.random() *
      CHEST_REWARDS.length
    );

  const reward =
    CHEST_REWARDS[randomIndex];

  showModal(
    "",
    `보물상자에서 [${reward}]을(를) 획득했습니다!`
  );
}

function showModal(imgUrl, text) {

  const modal =
    document.getElementById(
      "forest-modal"
    );

  const modalImg =
    document.getElementById(
      "modal-img"
    );

  const modalText =
    document.getElementById(
      "modal-text"
    );

  if (
    !modal ||
    !modalImg ||
    !modalText
  ) {
    return;
  }

  if (imgUrl) {

    modalImg.src = imgUrl;

    modalImg.style.display =
      "block";

  } else {

    modalImg.removeAttribute(
      "src"
    );

    modalImg.style.display =
      "none";
  }

  modalText.innerText =
    text;

  modal.style.display =
    "flex";
}

function closeModal() {

  const modal =
    document.getElementById(
      "forest-modal"
    );

  if (modal) {
    modal.style.display =
      "none";
  }
}

function checkForestBoundary() {

  const edge = 5;

  const room =
    forestGame.currentRoom;

  if (!room) {
    return;
  }

  if (forestGame.playerY <= edge) {

    forestGame.playerY = edge;

    if (room.exits.up) {
      handleDirection("up");
    }
  }

  if (
    forestGame.playerY >=
    100 - edge
  ) {

    forestGame.playerY =
      100 - edge;

    if (room.exits.down) {

      handleDirection("down");

    } else if (
      forestGame.depth === 0
    ) {

      exitForestGame();

      return;
    }
  }

  if (forestGame.playerX <= edge) {

    forestGame.playerX = edge;

    if (room.exits.left) {
      handleDirection("left");
    }
  }

  if (
    forestGame.playerX >=
    100 - edge
  ) {

    forestGame.playerX =
      100 - edge;

    if (room.exits.right) {
      handleDirection("right");
    }
  }
}

function handleDirection(direction) {

  const room =
    forestGame.currentRoom;

  if (!room) {
    return;
  }

  if (
    room.connections[direction]
  ) {

    moveToExistingRoom(
      direction
    );

    return;
  }

  enterDeeperForest(
    direction
  );
}

function enterDeeperForest(direction) {

  const currentRoom =
    forestGame.currentRoom;

  if (!currentRoom) {
    return;
  }

  forestGame.keys = {};

  const isSpecialTreeRoom =
    !forestGame.treeSpawned &&
    currentRoom.specialTreeDirection ===
    direction;

  const newRoom =
    createForestRoom(
      direction,
      isSpecialTreeRoom
    );

  if (isSpecialTreeRoom) {
    forestGame.treeSpawned = true;
  }

  currentRoom.connections[direction] =
    newRoom;

  const opposite =
    getOppositeDirection(
      direction
    );

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

  if (direction === "up") {

    forestGame.playerX = 50;
    forestGame.playerY = 90;

  } else if (
    direction === "down"
  ) {

    forestGame.playerX = 50;
    forestGame.playerY = 10;

  } else if (
    direction === "left"
  ) {

    forestGame.playerX = 90;
    forestGame.playerY = 50;

  } else if (
    direction === "right"
  ) {

    forestGame.playerX = 10;
    forestGame.playerY = 50;
  }

  renderForestRoom();
}

function moveToExistingRoom(direction) {

  const currentRoom =
    forestGame.currentRoom;

  if (!currentRoom) {
    return;
  }

  const targetRoom =
    currentRoom.connections[
      direction
    ];

  if (!targetRoom) {
    return;
  }

  forestGame.keys = {};

  if (
    targetRoom.parentDirection ===
    direction
  ) {

    forestGame.roomHistory.push(
      currentRoom
    );

    forestGame.depth++;

  } else {

    if (
      forestGame.roomHistory.length > 0
    ) {

      forestGame.roomHistory.pop();
    }

    forestGame.depth--;

    if (forestGame.depth < 0) {
      forestGame.depth = 0;
    }
  }

  forestGame.currentRoom =
    targetRoom;

  if (direction === "up") {

    forestGame.playerX = 50;
    forestGame.playerY = 90;

  } else if (
    direction === "down"
  ) {

    forestGame.playerX = 50;
    forestGame.playerY = 10;

  } else if (
    direction === "left"
  ) {

    forestGame.playerX = 90;
    forestGame.playerY = 50;

  } else if (
    direction === "right"
  ) {

    forestGame.playerX = 10;
    forestGame.playerY = 50;
  }

  renderForestRoom();
}

function exitForestGame() {

  console.log(
    "숲에서 나갑니다."
  );

  stopForestKeyboard();

  if (forestGame.animationId) {

    cancelAnimationFrame(
      forestGame.animationId
    );

    forestGame.animationId =
      null;
  }

  if (forestGame.screen) {

    forestGame.screen.remove();

    forestGame.screen =
      null;
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
  forestGame.treeSpawned = false;
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
    document.createElement(
      "style"
    );

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
    }

    .forest-room {
      position: absolute;
      left: 0;
      right: 0;
      top: 55px;
      bottom: 45px;
      overflow: hidden;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    }

    .forest-room.forest-normal {
      background-image: url("./forest-normal.png");
    }

    .forest-room.forest-deep {
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
      background: rgba(0, 0, 0, 0.35);
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

    .forest-entrance {
      position: absolute;
      background: rgba(10, 15, 10, 0.55);
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
      font-size: 40px;
      transform: translate(-50%, -50%);
      cursor: pointer;
      z-index: 4;
      user-select: none;
      transition: transform 0.2s;
    }

    .forest-object:hover {
      transform:
        translate(-50%, -50%)
        scale(1.2);
    }

    .forest-player {
      position: absolute;
      width: 30px;
      height: 30px;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      background: #ffffff;
      border: 3px solid #111111;
      box-sizing: border-box;
      z-index: 5;
      box-shadow:
        0 0 12px
        rgba(255, 255, 255, 0.5);
    }

    .forest-message {
      position: absolute;
      left: 50%;
      bottom: 12px;
      transform: translateX(-50%);
      z-index: 10;
      padding: 6px 12px;
      border-radius: 8px;
      background: rgba(0, 0, 0, 0.45);
      color: #e5e5e5;
      font-size: 12px;
      pointer-events: none;
      white-space: nowrap;
      transition: all 0.3s;
    }

    .forest-message.highlight {
      background:
        rgba(255, 193, 7, 0.85);
      color: #111;
      font-weight: bold;
    }

    .forest-modal {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      z-index: 100;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .forest-modal-content {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .modal-img {
      width: 260px;
      height: 260px;
      object-fit: contain;
      display: block;
      margin-bottom: 8px;
      border: none;
      border-radius: 0;
      background: transparent;
      box-shadow: none;
    }

    .modal-text {
      display: inline-block;
      padding: 10px 18px;
      border-radius: 8px;
      background: rgba(20, 30, 20, 0.9);
      font-size: 15px;
      font-weight: bold;
      color: #fff;
      margin-bottom: 12px;
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

console.log(
  "forest.js 로드 성공"
);
