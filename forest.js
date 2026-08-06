/* ==================================================
숲 탐험 게임
forest.js
================================================== */

// ==================================================
// 숲 게임 전역 변수
// ==================================================
console.log("========== forest.js 로드 성공 ==========");

let forestGame = {
  depth: 0,
  currentRoom: null,
  roomHistory: [], // 이전 방들의 기록을 저장하는 스택
  screen: null,
  player: null,
  playerX: 50,
  playerY: 50,
  keys: {},
  animationId: null
};

// ==================================================
// HTML 이스케이프 유틸리티 함수
// ==================================================
function escapeHtml(text) {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ==================================================
// 숲 공간 생성
// ==================================================
function createForestRoom(parentDirection) {
  const room = {
    parentDirection: parentDirection,
    exits: {
      left: false,
      right: false,
      up: false,
      down: false
    }
  };

  // 이전 숲으로 돌아가는 길 (진입 방향의 반대쪽)
  const opposite = getOppositeDirection(parentDirection);
  if (opposite) {
    room.exits[opposite] = true;
  }

  // 더 깊은 숲이 존재할 확률 (25%)
  const deeperForestProbability = 0.25;

  if (parentDirection !== "left" && Math.random() < deeperForestProbability) {
    room.exits.left = true;
  }
  if (parentDirection !== "right" && Math.random() < deeperForestProbability) {
    room.exits.right = true;
  }
  if (parentDirection !== "up" && Math.random() < deeperForestProbability) {
    room.exits.up = true;
  }
  if (parentDirection !== "down" && Math.random() < deeperForestProbability) {
    room.exits.down = true;
  }

  return room;
}

// ==================================================
// 숲 진입
// ==================================================
function enterForest(forestNumber, shelterName) {
  console.log("숲 탐험 시작:", forestNumber, shelterName);

  // 기존 게임 제거 및 정리
  exitForestGame();

  // 게임 초기화
  forestGame.depth = 0;
  forestGame.roomHistory = [];
  forestGame.playerX = 50;
  forestGame.playerY = 50;
  forestGame.currentRoom = {
    parentDirection: null,
    exits: {
      left: true,
      right: true,
      up: true,
      down: true
    }
  };

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
        <button class="forest-exit-button" onclick="exitForestGame()">나가기</button>
      </div>

      <div id="forest-room" class="forest-room">
        <div id="forest-up" class="forest-entrance forest-up"></div>
        <div id="forest-left" class="forest-entrance forest-left"></div>
        <div id="forest-right" class="forest-entrance forest-right"></div>
        <div id="forest-down" class="forest-entrance forest-down"></div>

        <div id="forest-player" class="forest-player"></div>
      </div>

      <div class="forest-message">방향키로 이동하십시오.</div>
    </div>
  `;

  document.body.appendChild(screen);
  forestGame.screen = screen;
  forestGame.player = document.getElementById("forest-player");

  // CSS 추가, 키보드 이벤트, 첫 방 렌더링, 루프 시작
  addForestGameStyle();
  startForestKeyboard();
  renderForestRoom();
  forestGameLoop();
}

// ==================================================
// 숲 공간 표시
// ==================================================
function renderForestRoom() {
  const room = forestGame.currentRoom;
  if (!room) return;

  const up = document.getElementById("forest-up");
  const left = document.getElementById("forest-left");
  const right = document.getElementById("forest-right");
  const down = document.getElementById("forest-down");

  if (up) up.style.display = room.exits.up ? "block" : "none";
  if (left) left.style.display = room.exits.left ? "block" : "none";
  if (right) right.style.display = room.exits.right ? "block" : "none";
  if (down) down.style.display = room.exits.down ? "block" : "none";

  updatePlayerPosition();
}

// ==================================================
// 키보드 입력 관리
// ==================================================
function startForestKeyboard() {
  stopForestKeyboard(); // 중복 등록 방지
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

  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
    event.preventDefault();
    forestGame.keys[event.key] = true;
  }
}

function forestKeyUp(event) {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
    forestGame.keys[event.key] = false;
  }
}

// ==================================================
// 게임 루프
// ==================================================
function forestGameLoop() {
  if (!forestGame.screen) return;

  movePlayer();
  updatePlayerPosition();
  forestGame.animationId = requestAnimationFrame(forestGameLoop);
}

// ==================================================
// 플레이어 이동
// ==================================================
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

// ==================================================
// 플레이어 위치 적용
// ==================================================
function updatePlayerPosition() {
  if (!forestGame.player) return;
  forestGame.player.style.left = forestGame.playerX + "%";
  forestGame.player.style.top = forestGame.playerY + "%";
}

// ==================================================
// 숲의 경계 확인 및 방 이동
// ==================================================
function checkForestBoundary() {
  const edge = 5;

  // 위쪽 경계
  if (forestGame.playerY <= edge) {
    forestGame.playerY = edge;
    if (forestGame.currentRoom.exits.up) {
      if (forestGame.currentRoom.parentDirection === "down") {
        moveBackOrExit();
      } else {
        enterDeeperForest("up");
      }
    }
  }

  // 아래쪽 경계
  if (forestGame.playerY >= 100 - edge) {
    forestGame.playerY = 100 - edge;
    if (forestGame.currentRoom.exits.down) {
      if (forestGame.currentRoom.parentDirection === "up") {
        moveBackOrExit();
      } else {
        enterDeeperForest("down");
      }
    }
  }

  // 왼쪽 경계
  if (forestGame.playerX <= edge) {
    forestGame.playerX = edge;
    if (forestGame.currentRoom.exits.left) {
      if (forestGame.currentRoom.parentDirection === "right") {
        moveBackOrExit();
      } else {
        enterDeeperForest("left");
      }
    }
  }

  // 오른쪽 경계
  if (forestGame.playerX >= 100 - edge) {
    forestGame.playerX = 100 - edge;
    if (forestGame.currentRoom.exits.right) {
      if (forestGame.currentRoom.parentDirection === "left") {
        moveBackOrExit();
      } else {
        enterDeeperForest("right");
      }
    }
  }
}

// ==================================================
// 깊은 숲으로 이동
// ==================================================
function enterDeeperForest(direction) {
  forestGame.keys = {};

  // 현재 방 상태 기록 저장
  forestGame.roomHistory.push(forestGame.currentRoom);
  forestGame.depth++;

  // 새 방 생성
  forestGame.currentRoom = createForestRoom(direction);

  // 이동 방향에 맞춘 플레이어 스폰 위치 설정
  if (direction === "up") { forestGame.playerX = 50; forestGame.playerY = 90; }
  else if (direction === "down") { forestGame.playerX = 50; forestGame.playerY = 10; }
  else if (direction === "left") { forestGame.playerX = 90; forestGame.playerY = 50; }
  else if (direction === "right") { forestGame.playerX = 10; forestGame.playerY = 50; }

  renderForestRoom();
}

// ==================================================
// 이전 숲으로 돌아가기 또는 나가기
// ==================================================
function moveBackOrExit() {
  forestGame.keys = {};

  if (forestGame.depth === 0 || forestGame.roomHistory.length === 0) {
    exitForestGame();
    return;
  }

  const prevDirection = forestGame.currentRoom.parentDirection;

  // 히스토리에서 이전 방 복원
  forestGame.depth--;
  forestGame.currentRoom = forestGame.roomHistory.pop();

  // 돌아갈 때의 플레이어 스폰 위치 설정
  if (prevDirection === "up") { forestGame.playerX = 50; forestGame.playerY = 10; }
  else if (prevDirection === "down") { forestGame.playerX = 50; forestGame.playerY = 90; }
  else if (prevDirection === "left") { forestGame.playerX = 10; forestGame.playerY = 50; }
  else if (prevDirection === "right") { forestGame.playerX = 90; forestGame.playerY = 50; }

  renderForestRoom();
}

// ==================================================
// 반대 방향 구하기
// ==================================================
function getOppositeDirection(direction) {
  const map = {
    left: "right",
    right: "left",
    up: "down",
    down: "up"
  };
  return map[direction] || null;
}

// ==================================================
// 숲에서 나가기
// ==================================================
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
  forestGame.keys = {};
}

// ==================================================
// 숲 게임 CSS
// ==================================================
function addForestGameStyle() {
  if (document.getElementById("forest-game-style")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "forest-game-style";
  style.innerHTML = `
    #forest-game-screen {
      position: fixed;
      inset: 0;
      z-index: 9999;
      color: white;
      font-family: sans-serif;
    }

    .forest-game {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: radial-gradient(
        ellipse at center,
        #465a3d 0%,
        #263522 55%,
        #172116 100%
      );
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
    }

    .forest-room {
      position: absolute;
      left: 0;
      right: 0;
      top: 55px;
      bottom: 45px;
      overflow: hidden;
    }

    .forest-room::before {
      content: "";
      position: absolute;
      left: 50%;
      top: 50%;
      width: 42%;
      height: 42%;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      background: rgba(88, 112, 70, 0.18);
      box-shadow: 0 0 80px rgba(0, 0, 0, 0.35);
      pointer-events: none;
    }

    .forest-entrance {
      position: absolute;
      background: rgba(10, 15, 10, 0.75);
      box-shadow:
        inset 0 0 30px rgba(0, 0, 0, 0.85),
        0 0 25px rgba(0, 0, 0, 0.3);
      pointer-events: none;
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
      bottom: 0;
      width: 110px;
      height: 55px;
      transform: translateX(-50%);
      border-radius: 55px 55px 0 0;
    }

    .forest-player {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 28px;
      height: 28px;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      background: #81c784;
      border: 3px solid white;
      box-sizing: border-box;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
      z-index: 5;
      pointer-events: none;
    }

    .forest-message {
      position: absolute;
      left: 50%;
      bottom: 12px;
      transform: translateX(-50%);
      z-index: 10;
      color: rgba(255, 255, 255, 0.7);
      font-size: 12px;
      text-align: center;
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);
}
