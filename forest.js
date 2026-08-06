/* ==================================================
   숲 탐험 게임
   forest.js
================================================== */

/* ==================================================
   몬스터 & 보물상자 데이터 리스트
================================================== */
const MONSTER_LIST = [
  { name: "티거", img: "./2112.png" },
  { name: "티거", img: "./2112.png" },
  { name: "티거", img: "./2112.png" },
  { name: "티거", img: "./2112.png" }
];

const CHEST_REWARDS = [
  "100 골드",
  "체력 회복 포션",
  "마나 회복 포션",
  "낡은 숲의 열쇠",
  "희귀한 버섯"
];

/* ==================================================
   숲 게임 전역 상태
================================================== */
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
  nearObject: null // 현재 플레이어와 인접한 오브젝트 ('tree' | 'chest' | null)
};

/* ==================================================
   HTML 이스케이프
================================================== */
function escapeHtml(text) {
  if (text === null || text === undefined) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ==================================================
   숲 방 생성
================================================== */
function createForestRoom(parentDirection, isSpecialTreeRoom = false) {
  const room = {
    parentDirection: parentDirection,
    exits: { left: false, right: false, up: false, down: false },
    tree: null,
    chest: null
  };

  // 이전 숲으로 돌아가는 길
  const opposite = getOppositeDirection(parentDirection);
  if (opposite) {
    room.exits[opposite] = true;
  }

  // 더 깊은 숲 생성 확률 (25%)
  const deeperForestProbability = 0.25;
  const availableDirections = [];

  if (parentDirection !== "left" && Math.random() < deeperForestProbability) {
    room.exits.left = true;
    availableDirections.push("left");
  }
  if (parentDirection !== "right" && Math.random() < deeperForestProbability) {
    room.exits.right = true;
    availableDirections.push("right");
  }
  if (parentDirection !== "up" && Math.random() < deeperForestProbability) {
    room.exits.up = true;
    availableDirections.push("up");
  }
  if (parentDirection !== "down" && Math.random() < deeperForestProbability) {
    room.exits.down = true;
    availableDirections.push("down");
  }

  // 세 방향 중 한 곳을 나무 방으로 확정 지정하기 위한 값
  room.specialTreeDirection = null;
  if (availableDirections.length > 0) {
    const randomIndex = Math.floor(Math.random() * availableDirections.length);
    room.specialTreeDirection = availableDirections[randomIndex];
  }

  // 1. 나무 배치 (특별 방일 경우 중앙에 나무 생성)
  if (isSpecialTreeRoom) {
    room.tree = { x: 50, y: 50, visited: false };
  }

  // 2. 보물상자 배치 (모서리 4곳 중 랜덤 35% 확률)
  if (Math.random() < 0.35) {
    const corners = [
      { x: 15, y: 15 },
      { x: 85, y: 15 },
      { x: 15, y: 85 },
      { x: 85, y: 85 }
    ];
    const chosenCorner = corners[Math.floor(Math.random() * corners.length)];
    room.chest = { x: chosenCorner.x, y: chosenCorner.y, opened: false };
  }

  return room;
}

/* ==================================================
   숲 진입
================================================== */
function enterForest(forestNumber, shelterName) {
  console.log("숲 탐험 시작:", forestNumber, shelterName);

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

  // 첫 번째 방 생성
  const firstRoom = {
    parentDirection: null,
    exits: { left: true, right: true, up: true, down: false },
    tree: null,
    chest: null
  };
  // 3가지 방향 중 1곳을 확정 나무 방으로 선정
  const dirs = ["left", "right", "up"];
  firstRoom.specialTreeDirection = dirs[Math.floor(Math.random() * dirs.length)];

  forestGame.currentRoom = firstRoom;

  // 게임 화면 생성
  const screen = document.createElement("div");
  screen.id = "forest-game-screen";
  screen.innerHTML = `
    <div class="forest-game">
      <div class="forest-header">
        <div>
          <strong>숲 ${escapeHtml(forestNumber)}</strong>
          <span>${escapeHtml(shelterName)}</span>
        </div>
        <button type="button" class="forest-exit-button" onclick="exitForestGame()">
          지도으로 돌아가기
        </button>
      </div>

      <div id="forest-room" class="forest-room">
        <div id="forest-up" class="forest-entrance forest-up"></div>
        <div id="forest-left" class="forest-entrance forest-left"></div>
        <div id="forest-right" class="forest-entrance forest-right"></div>
        <div id="forest-down" class="forest-entrance forest-down"></div>

        <div id="forest-tree" class="forest-object forest-tree" onclick="interactTree()" style="display:none;">🌳</div>
        <div id="forest-chest" class="forest-object forest-chest" onclick="interactChest()" style="display:none;">🎁</div>

        <div id="forest-player" class="forest-player"></div>
      </div>

      <div id="forest-message" class="forest-message">방향키로 이동하십시오.</div>

      <div id="forest-modal" class="forest-modal" style="display:none;" onclick="closeModal()">
        <div class="forest-modal-content" onclick="event.stopPropagation()">
          <img id="modal-img" src="" alt="보상 이미지" class="modal-img" />
          <div id="modal-text" class="modal-text"></div>
          <button class="modal-close-btn" onclick="closeModal()">확인</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(screen);
  forestGame.screen = screen;
  forestGame.player = document.getElementById("forest-player");

  addForestGameStyle();
  startForestKeyboard();
  renderForestRoom();
  forestGameLoop();
}

/* ==================================================
   현재 숲 공간 및 오브젝트 표시
================================================== */
function renderForestRoom() {
  const room = forestGame.currentRoom;
  if (!room) return;

  // 입구 렌더링
  document.getElementById("forest-up").style.display = room.exits.up ? "block" : "none";
  document.getElementById("forest-left").style.display = room.exits.left ? "block" : "none";
  document.getElementById("forest-right").style.display = room.exits.right ? "block" : "none";
  document.getElementById("forest-down").style.display = room.exits.down ? "block" : "none";

  // 나무 렌더링
  const treeEl = document.getElementById("forest-tree");
  if (room.tree) {
    treeEl.style.left = room.tree.x + "%";
    treeEl.style.top = room.tree.y + "%";
    treeEl.style.display = "block";
  } else {
    treeEl.style.display = "none";
  }

  // 보물상자 렌더링
  const chestEl = document.getElementById("forest-chest");
  if (room.chest) {
    chestEl.style.left = room.chest.x + "%";
    chestEl.style.top = room.chest.y + "%";
    chestEl.innerText = room.chest.opened ? "📦" : "🎁";
    chestEl.style.display = "block";
  } else {
    chestEl.style.display = "none";
  }

  updatePlayerPosition();
}

/* ==================================================
   키보드 입력
================================================== */
function startForestKeyboard() {
  stopForestKeyboard();
  document.addEventListener("keydown", forestKeyDown);
  document.addEventListener("keyup", forestKeyUp);
}

function stopForestKeyboard() {
  document.removeEventListener("keydown", forestKeyDown);
  document.removeEventListener("keyup", forestKeyUp);
  forestGame.keys = {};
}

function forestKeyDown(event) {
  if (!forestGame.screen) return;

  const allowedKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Shift"];
  if (allowedKeys.includes(event.key)) {
    event.preventDefault();
    forestGame.keys[event.key] = true;

    // Shift 키를 눌렀을 때 상호작용 실행
    if (event.key === "Shift") {
      checkInteraction();
    }
  }
}

function forestKeyUp(event) {
  const allowedKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Shift"];
  if (allowedKeys.includes(event.key)) {
    forestGame.keys[event.key] = false;
  }
}

/* ==================================================
   게임 루프
================================================== */
function forestGameLoop() {
  if (!forestGame.screen) return;

  movePlayer();
  updatePlayerPosition();
  checkObjectProximity(); // 오브젝트 근처인지 상시 감지

  forestGame.animationId = requestAnimationFrame(forestGameLoop);
}

/* ==================================================
   플레이어 이동
================================================== */
function movePlayer() {
  const speed = 0.45;
  let moved = false;

  if (forestGame.keys["ArrowUp"]) { forestGame.playerY -= speed; moved = true; }
  if (forestGame.keys["ArrowDown"]) { forestGame.playerY += speed; moved = true; }
  if (forestGame.keys["ArrowLeft"]) { forestGame.playerX -= speed; moved = true; }
  if (forestGame.keys["ArrowRight"]) { forestGame.playerX += speed; moved = true; }

  if (moved) {
    checkForestBoundary();
  }
}

function updatePlayerPosition() {
  if (!forestGame.player) return;
  forestGame.player.style.left = forestGame.playerX + "%";
  forestGame.player.style.top = forestGame.playerY + "%";
}

/* ==================================================
   오브젝트 접근 거리 계산 및 안내 문구 업데이트
================================================== */
function checkObjectProximity() {
  const room = forestGame.currentRoom;
  const msgEl = document.getElementById("forest-message");
  if (!room || !msgEl) return;

  const threshold = 8; // 접근 감지 거리(%)
  let near = null;

  // 나무 감지
  if (room.tree) {
    const dist = Math.hypot(forestGame.playerX - room.tree.x, forestGame.playerY - room.tree.y);
    if (dist < threshold) near = "tree";
  }

  // 보물상자 감지
  if (!near && room.chest && !room.chest.opened) {
    const dist = Math.hypot(forestGame.playerX - room.chest.x, forestGame.playerY - room.chest.y);
    if (dist < threshold) near = "chest";
  }

  forestGame.nearObject = near;

  // 문구 변경
  if (near === "tree") {
    msgEl.innerText = "🌳 [Shift 키] 또는 [클릭]하여 나무 조사하기";
    msgEl.classList.add("highlight");
  } else if (near === "chest") {
    msgEl.innerText = "🎁 [Shift 키] 또는 [클릭]하여 보물상자 열기";
    msgEl.classList.add("highlight");
  } else {
    msgEl.innerText = "방향키로 이동하십시오.";
    msgEl.classList.remove("highlight");
  }
}

/* ==================================================
   상호작용 실행 (Shift 입력 시)
================================================== */
function checkInteraction() {
  if (forestGame.nearObject === "tree") {
    interactTree();
  } else if (forestGame.nearObject === "chest") {
    interactChest();
  }
}

function interactTree() {
  const room = forestGame.currentRoom;
  if (!room || !room.tree) return;

  // 몬스터 목록 중 랜덤 선택
  const randomMonster = MONSTER_LIST[Math.floor(Math.random() * MONSTER_LIST.length)];
  showModal(randomMonster.img, `'${randomMonster.name}'을(를) 획득했다!`);
}

function interactChest() {
  const room = forestGame.currentRoom;
  if (!room || !room.chest || room.chest.opened) return;

  room.chest.opened = true;
  document.getElementById("forest-chest").innerText = "📦";

  const randomReward = CHEST_REWARDS[Math.floor(Math.random() * CHEST_REWARDS.length)];
  showModal("https://via.placeholder.com/150/ffb74d/ffffff?text=Treasure", `보물상자에서 [${randomReward}]을(를) 획득했습니다!`);
}

/* ==================================================
   팝업 모달 출력
================================================== */
function showModal(imgUrl, text) {
  const modal = document.getElementById("forest-modal");
  const modalImg = document.getElementById("modal-img");
  const modalText = document.getElementById("modal-text");

  if (modal && modalImg && modalText) {
    modalImg.src = imgUrl;
    modalText.innerText = text;
    modal.style.display = "flex";
  }
}

function closeModal() {
  const modal = document.getElementById("forest-modal");
  if (modal) modal.style.display = "none";
}

/* ==================================================
   숲 경계 확인 및 방 이동
================================================== */
function checkForestBoundary() {
  const edge = 5;

  if (forestGame.playerY <= edge) {
    forestGame.playerY = edge;
    if (forestGame.currentRoom.exits.up) {
      forestGame.currentRoom.parentDirection === "down" ? moveBackOrExit() : enterDeeperForest("up");
    }
  }

  if (forestGame.playerY >= 100 - edge) {
    forestGame.playerY = 100 - edge;
    if (forestGame.currentRoom.exits.down) {
      forestGame.currentRoom.parentDirection === "up" ? moveBackOrExit() : enterDeeperForest("down");
    }
    if (forestGame.depth === 0 && !forestGame.currentRoom.exits.down) {
      exitForestGame();
    }
  }

  if (forestGame.playerX <= edge) {
    forestGame.playerX = edge;
    if (forestGame.currentRoom.exits.left) {
      forestGame.currentRoom.parentDirection === "right" ? moveBackOrExit() : enterDeeperForest("left");
    }
  }

  if (forestGame.playerX >= 100 - edge) {
    forestGame.playerX = 100 - edge;
    if (forestGame.currentRoom.exits.right) {
      forestGame.currentRoom.parentDirection === "left" ? moveBackOrExit() : enterDeeperForest("right");
    }
  }
}

/* ==================================================
   더 깊은 숲으로 이동
================================================== */
function enterDeeperForest(direction) {
  forestGame.keys = {};

  // 이전 방의 특수 나무 진입 방향이었는지 확인
  const isSpecialTreeRoom = (forestGame.currentRoom.specialTreeDirection === direction);

  forestGame.roomHistory.push(forestGame.currentRoom);
  forestGame.depth++;

  forestGame.currentRoom = createForestRoom(direction, isSpecialTreeRoom);

  // 이동 방향별 시작 위치
  if (direction === "up") { forestGame.playerX = 50; forestGame.playerY = 90; }
  else if (direction === "down") { forestGame.playerX = 50; forestGame.playerY = 10; }
  else if (direction === "left") { forestGame.playerX = 90; forestGame.playerY = 50; }
  else if (direction === "right") { forestGame.playerX = 10; forestGame.playerY = 50; }

  renderForestRoom();
}

/* ==================================================
   이전 숲으로 돌아가기
================================================== */
function moveBackOrExit() {
  forestGame.keys = {};

  if (forestGame.depth === 0 || forestGame.roomHistory.length === 0) {
    exitForestGame();
    return;
  }

  const prevDirection = forestGame.currentRoom.parentDirection;
  forestGame.depth--;
  forestGame.currentRoom = forestGame.roomHistory.pop();

  if (prevDirection === "up") { forestGame.playerX = 50; forestGame.playerY = 10; }
  else if (prevDirection === "down") { forestGame.playerX = 50; forestGame.playerY = 90; }
  else if (prevDirection === "left") { forestGame.playerX = 10; forestGame.playerY = 50; }
  else if (prevDirection === "right") { forestGame.playerX = 90; forestGame.playerY = 50; }

  renderForestRoom();
}

function getOppositeDirection(direction) {
  const map = { left: "right", right: "left", up: "down", down: "up" };
  return map[direction] || null;
}

/* ==================================================
   숲에서 나가기
================================================== */
function exitForestGame() {
  console.log("숲에서 나갑니다.");
  stopForestKeyboard();

  if (forestGame.animationId) {
    cancelAnimationFrame(forestGame.animationId);
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

/* ==================================================
   숲 게임 CSS
================================================== */
function addForestGameStyle() {
  if (document.getElementById("forest-game-style")) return;

  const style = document.createElement("style");
  style.id = "forest-game-style";
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
      background: radial-gradient(ellipse at center, #465a3d 0%, #263522 55%, #172116 100%);
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

    .forest-header strong { display: block; font-size: 20px; }
    .forest-header span { display: block; margin-top: 3px; font-size: 12px; color: #c9d0c6; }

    .forest-exit-button {
      border: none;
      border-radius: 8px;
      padding: 8px 13px;
      background: rgba(255, 255, 255, 0.15);
      color: white;
      cursor: pointer;
      font-size: 13px;
    }
    .forest-exit-button:hover { background: rgba(255, 255, 255, 0.25); }

    .forest-room {
      position: absolute;
      left: 0; right: 0; top: 55px; bottom: 45px;
      overflow: hidden;
    }

    .forest-room::before {
      content: "";
      position: absolute;
      left: 50%; top: 50%;
      width: 42%; height: 42%;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      background: rgba(88, 112, 70, 0.18);
      box-shadow: 0 0 80px rgba(0, 0, 0, 0.35);
      pointer-events: none;
    }

    .forest-entrance {
      position: absolute;
      background: rgba(10, 15, 10, 0.75);
      box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.85), 0 0 25px rgba(0, 0, 0, 0.3);
      pointer-events: none;
      z-index: 2;
    }

    .forest-up { left: 50%; top: 2%; width: 160px; height: 80px; transform: translateX(-50%); border-radius: 80px 80px 0 0; }
    .forest-left { left: 2%; top: 50%; width: 80px; height: 160px; transform: translateY(-50%); border-radius: 0 80px 80px 0; }
    .forest-right { right: 2%; top: 50%; width: 80px; height: 160px; transform: translateY(-50%); border-radius: 80px 0 0 80px; }
    .forest-down { left: 50%; bottom: 2%; width: 160px; height: 80px; transform: translateX(-50%); border-radius: 0 0 80px 80px; }

    /* 오브젝트 (나무, 보물상자) */
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
      transform: translate(-50%, -50%) scale(1.2);
    }

    .forest-player {
      position: absolute;
      width: 30px; height: 30px;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      background: #ffffff;
      border: 3px solid #111111;
      box-sizing: border-box;
      z-index: 5;
      box-shadow: 0 0 12px rgba(255, 255, 255, 0.5);
    }

    .forest-message {
      position: absolute;
      left: 50%; bottom: 12px;
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
      background: rgba(255, 193, 7, 0.85);
      color: #111;
      font-weight: bold;
    }

    /* 팝업 모달 */
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
      object-fit: cover;
      border-radius: 8px;
      margin-bottom: 12px;
      border: 2px solid #fff;
    }
    .modal-text {
      font-size: 15px;
      font-weight: bold;
      color: #fff;
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
    .modal-close-btn:hover { background: #a5d6a7; }
  `;
  document.head.appendChild(style);
}

console.log("forest.js 로드 성공");
