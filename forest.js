
/* ==================================================
   숲 탐험 게임
   forest.js
================================================== */


/* ==================================================
   숲 게임 전역 상태
================================================== */

let forestGame = {
  depth: 0,

  currentRoom: null,

  // 이전 숲들을 저장하는 스택
  roomHistory: [],

  screen: null,

  player: null,

  playerX: 50,

  playerY: 50,

  keys: {},

  animationId: null,

  forestNumber: null,

  shelterName: ""
};


/* ==================================================
   HTML 이스케이프
================================================== */

function escapeHtml(text) {

  if (
    text === null ||
    text === undefined
  ) {
    return "";
  }

  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* ==================================================
   숲 방 생성
==================================================

   parentDirection
   = 현재 숲으로 들어온 방향

   예:
   ↑ 방향으로 깊은 숲에 들어왔다면
   그 숲의 ↓ 방향은 반드시 이전 숲으로 돌아가는 길

================================================== */

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


  /* ------------------------------------------
     이전 숲으로 돌아가는 길
  ------------------------------------------ */

  const opposite =
    getOppositeDirection(parentDirection);

  if (opposite) {

    room.exits[opposite] = true;

  }


  /* ------------------------------------------
     더 깊은 숲 생성 확률
     
     현재는 25%
     
     즉,
     대부분의 방향에는 숲이 없고
     일부 방향에만 숲이 존재합니다.
  ------------------------------------------ */

  const deeperForestProbability = 0.25;


  /* 왼쪽 */

  if (
    parentDirection !== "left" &&
    Math.random() < deeperForestProbability
  ) {

    room.exits.left = true;

  }


  /* 오른쪽 */

  if (
    parentDirection !== "right" &&
    Math.random() < deeperForestProbability
  ) {

    room.exits.right = true;

  }


  /* 위쪽 */

  if (
    parentDirection !== "up" &&
    Math.random() < deeperForestProbability
  ) {

    room.exits.up = true;

  }


  /* 아래쪽 */

  if (
    parentDirection !== "down" &&
    Math.random() < deeperForestProbability
  ) {

    room.exits.down = true;

  }


  return room;
}


/* ==================================================
   숲 진입
================================================== */

function enterForest(
  forestNumber,
  shelterName
) {

  console.log(
    "숲 탐험 시작:",
    forestNumber,
    shelterName
  );


  /* ------------------------------------------
     이미 숲이 열려 있다면 기존 게임 정리
  ------------------------------------------ */

  if (forestGame.screen) {

    exitForestGame();

  }


  /* ------------------------------------------
     게임 상태 초기화
  ------------------------------------------ */

  forestGame.depth = 0;

  forestGame.roomHistory = [];

  forestGame.playerX = 50;

  forestGame.playerY = 50;

  forestGame.forestNumber =
    forestNumber;

  forestGame.shelterName =
    shelterName;


  /* ------------------------------------------
     첫 번째 숲

     ← → ↑ = 깊은 숲으로 이동 가능
     ↓     = 지도 화면으로 나가기
  ------------------------------------------ */

  forestGame.currentRoom = {

    parentDirection: null,

    exits: {

      left: true,

      right: true,

      up: true,

      down: false

    }

  };


  /* ------------------------------------------
     게임 화면 생성
  ------------------------------------------ */

  const screen =
    document.createElement("div");

  screen.id =
    "forest-game-screen";


  screen.innerHTML = `

    <div class="forest-game">

      <!-- =====================================
           상단 정보
      ====================================== -->

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


      <!-- =====================================
           숲 공간
      ====================================== -->

      <div
        id="forest-room"
        class="forest-room"
      >

        <!-- 위쪽 입구 -->

        <div
          id="forest-up"
          class="forest-entrance forest-up"
        ></div>


        <!-- 왼쪽 입구 -->

        <div
          id="forest-left"
          class="forest-entrance forest-left"
        ></div>


        <!-- 오른쪽 입구 -->

        <div
          id="forest-right"
          class="forest-entrance forest-right"
        ></div>


        <!-- 아래쪽 입구 -->

        <div
          id="forest-down"
          class="forest-entrance forest-down"
        ></div>


        <!-- 임시 캐릭터 -->

        <div
          id="forest-player"
          class="forest-player"
        ></div>

      </div>


      <!-- =====================================
           안내
      ====================================== -->

      <div class="forest-message">

        방향키로 이동하십시오.

      </div>

    </div>

  `;


  document.body.appendChild(screen);


  forestGame.screen =
    screen;


  forestGame.player =
    document.getElementById(
      "forest-player"
    );


  /* ------------------------------------------
     CSS 추가
  ------------------------------------------ */

  addForestGameStyle();


  /* ------------------------------------------
     키보드 입력 시작
  ------------------------------------------ */

  startForestKeyboard();


  /* ------------------------------------------
     첫 번째 방 표시
  ------------------------------------------ */

  renderForestRoom();


  /* ------------------------------------------
     게임 루프 시작
  ------------------------------------------ */

  forestGameLoop();

}


/* ==================================================
   현재 숲 공간 표시
================================================== */

function renderForestRoom() {

  const room =
    forestGame.currentRoom;


  if (!room) {

    return;

  }


  const up =
    document.getElementById(
      "forest-up"
    );


  const left =
    document.getElementById(
      "forest-left"
    );


  const right =
    document.getElementById(
      "forest-right"
    );


  const down =
    document.getElementById(
      "forest-down"
    );


  /* ------------------------------------------
     입구 표시

     true  → 어두운 반타원 표시
     false → 표시하지 않음
  ------------------------------------------ */

  if (up) {

    up.style.display =
      room.exits.up
        ? "block"
        : "none";

  }


  if (left) {

    left.style.display =
      room.exits.left
        ? "block"
        : "none";

  }


  if (right) {

    right.style.display =
      room.exits.right
        ? "block"
        : "none";

  }


  if (down) {

    down.style.display =
      room.exits.down
        ? "block"
        : "none";

  }


  updatePlayerPosition();

}


/* ==================================================
   키보드 입력 시작
================================================== */

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


/* ==================================================
   키보드 입력 종료
================================================== */

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


/* ==================================================
   키 눌림
================================================== */

function forestKeyDown(event) {

  if (!forestGame.screen) {

    return;

  }


  const allowedKeys = [

    "ArrowUp",

    "ArrowDown",

    "ArrowLeft",

    "ArrowRight"

  ];


  if (
    allowedKeys.includes(event.key)
  ) {

    event.preventDefault();

    forestGame.keys[event.key] =
      true;

  }

}


/* ==================================================
   키 뗌
================================================== */

function forestKeyUp(event) {

  const allowedKeys = [

    "ArrowUp",

    "ArrowDown",

    "ArrowLeft",

    "ArrowRight"

  ];


  if (
    allowedKeys.includes(event.key)
  ) {

    forestGame.keys[event.key] =
      false;

  }

}


/* ==================================================
   게임 루프
================================================== */

function forestGameLoop() {

  if (!forestGame.screen) {

    return;

  }


  movePlayer();


  updatePlayerPosition();


  forestGame.animationId =
    requestAnimationFrame(
      forestGameLoop
    );

}


/* ==================================================
   플레이어 이동
================================================== */

function movePlayer() {

  const speed = 0.45;

  let moved = false;


  /* ------------------------------------------
     위
  ------------------------------------------ */

  if (
    forestGame.keys["ArrowUp"]
  ) {

    forestGame.playerY -=
      speed;

    moved = true;

  }


  /* ------------------------------------------
     아래
  ------------------------------------------ */

  if (
    forestGame.keys["ArrowDown"]
  ) {

    forestGame.playerY +=
      speed;

    moved = true;

  }


  /* ------------------------------------------
     왼쪽
  ------------------------------------------ */

  if (
    forestGame.keys["ArrowLeft"]
  ) {

    forestGame.playerX -=
      speed;

    moved = true;

  }


  /* ------------------------------------------
     오른쪽
  ------------------------------------------ */

  if (
    forestGame.keys["ArrowRight"]
  ) {

    forestGame.playerX +=
      speed;

    moved = true;

  }


  if (moved) {

    checkForestBoundary();

  }

}


/* ==================================================
   플레이어 위치 적용
================================================== */

function updatePlayerPosition() {

  if (!forestGame.player) {

    return;

  }


  forestGame.player.style.left =
    forestGame.playerX + "%";


  forestGame.player.style.top =
    forestGame.playerY + "%";

}


/* ==================================================
   숲 경계 확인
================================================== */

function checkForestBoundary() {

  const edge = 5;


  /* ==========================================
     위쪽
  ========================================== */

  if (
    forestGame.playerY <= edge
  ) {

    forestGame.playerY =
      edge;


    if (
      forestGame.currentRoom.exits.up
    ) {

      /*
        현재 숲이 ↑ 방향으로 들어온 숲이라면
        ↑ 방향은 더 깊은 숲으로 가는 것이 아니라
        이전 숲으로 돌아가는 방향입니다.
      */

      if (
        forestGame.currentRoom.parentDirection ===
        "down"
      ) {

        moveBackOrExit();

      }

      else {

        enterDeeperForest("up");

      }

    }

  }


  /* ==========================================
     아래쪽
  ========================================== */

  if (
    forestGame.playerY >=
    100 - edge
  ) {

    forestGame.playerY =
      100 - edge;


    if (
      forestGame.currentRoom.exits.down
    ) {

      /*
        첫 번째 숲에서는 down이 false이므로
        이곳에 들어오지 않습니다.

        깊은 숲에서 ↓가 이전 숲으로
        돌아가는 방향인 경우에만
        moveBackOrExit()가 실행됩니다.
      */

      if (
        forestGame.currentRoom.parentDirection ===
        "up"
      ) {

        moveBackOrExit();

      }

      else {

        enterDeeperForest("down");

      }

    }


    /*
      첫 번째 숲의 ↓

      입구가 없으므로 위 조건이 실행되지 않습니다.
      대신 아래 조건으로 지도에서 나갑니다.
    */

    if (
      forestGame.depth === 0 &&
      !forestGame.currentRoom.exits.down
    ) {

      exitForestGame();

    }

  }


  /* ==========================================
     왼쪽
  ========================================== */

  if (
    forestGame.playerX <= edge
  ) {

    forestGame.playerX =
      edge;


    if (
      forestGame.currentRoom.exits.left
    ) {

      if (
        forestGame.currentRoom.parentDirection ===
        "right"
      ) {

        moveBackOrExit();

      }

      else {

        enterDeeperForest("left");

      }

    }

  }


  /* ==========================================
     오른쪽
  ========================================== */

  if (
    forestGame.playerX >=
    100 - edge
  ) {

    forestGame.playerX =
      100 - edge;


    if (
      forestGame.currentRoom.exits.right
    ) {

      if (
        forestGame.currentRoom.parentDirection ===
        "left"
      ) {

        moveBackOrExit();

      }

      else {

        enterDeeperForest("right");

      }

    }

  }

}


/* ==================================================
   더 깊은 숲으로 이동
================================================== */

function enterDeeperForest(direction) {

  /*
    키를 계속 누르고 있는 상태에서
    방이 여러 번 생성되는 것을 방지
  */

  forestGame.keys = {};


  /* ------------------------------------------
     현재 숲 저장
  ------------------------------------------ */

  forestGame.roomHistory.push(
    forestGame.currentRoom
  );


  /* ------------------------------------------
     깊이 증가
  ------------------------------------------ */

  forestGame.depth++;


  /* ------------------------------------------
     새로운 숲 생성
  ------------------------------------------ */

  forestGame.currentRoom =
    createForestRoom(direction);


  /* ------------------------------------------
     새 숲에 들어왔을 때
     플레이어 시작 위치
  ------------------------------------------ */

  if (
    direction === "up"
  ) {

    /*
      위쪽으로 들어왔으므로
      플레이어는 화면 아래쪽에서 시작
    */

    forestGame.playerX = 50;

    forestGame.playerY = 90;

  }


  else if (
    direction === "down"
  ) {

    forestGame.playerX = 50;

    forestGame.playerY = 10;

  }


  else if (
    direction === "left"
  ) {

    forestGame.playerX = 90;

    forestGame.playerY = 50;

  }


  else if (
    direction === "right"
  ) {

    forestGame.playerX = 10;

    forestGame.playerY = 50;

  }


  renderForestRoom();

}


/* ==================================================
   이전 숲으로 돌아가기 또는 지도에서 나가기
================================================== */

function moveBackOrExit() {

  forestGame.keys = {};


  /* ------------------------------------------
     첫 번째 숲이라면 지도 화면으로 나감
  ------------------------------------------ */

  if (
    forestGame.depth === 0 ||
    forestGame.roomHistory.length === 0
  ) {

    exitForestGame();

    return;

  }


  /* ------------------------------------------
     현재 깊은 숲으로 들어온 방향
  ------------------------------------------ */

  const prevDirection =
    forestGame.currentRoom.parentDirection;


  /* ------------------------------------------
     깊이 감소
  ------------------------------------------ */

  forestGame.depth--;


  /* ------------------------------------------
     이전 숲 복원
  ------------------------------------------ */

  forestGame.currentRoom =
    forestGame.roomHistory.pop();


  /* ------------------------------------------
     이전 숲에서 돌아온 위치

     예:
     ↑로 깊은 숲에 들어감
     ↓로 돌아옴

     → 이전 숲의 위쪽에서 시작
  ------------------------------------------ */

  if (
    prevDirection === "up"
  ) {

    forestGame.playerX = 50;

    forestGame.playerY = 10;

  }


  else if (
    prevDirection === "down"
  ) {

    forestGame.playerX = 50;

    forestGame.playerY = 90;

  }


  else if (
    prevDirection === "left"
  ) {

    forestGame.playerX = 10;

    forestGame.playerY = 50;

  }


  else if (
    prevDirection === "right"
  ) {

    forestGame.playerX = 90;

    forestGame.playerY = 50;

  }


  renderForestRoom();

}


/* ==================================================
   반대 방향
================================================== */

function getOppositeDirection(direction) {

  const map = {

    left: "right",

    right: "left",

    up: "down",

    down: "up"

  };


  return map[direction] || null;

}


/* ==================================================
   숲에서 나가기
================================================== */

function exitForestGame() {

  console.log(
    "숲에서 나갑니다."
  );


  /* ------------------------------------------
     키보드 이벤트 제거
  ------------------------------------------ */

  stopForestKeyboard();


  /* ------------------------------------------
     게임 루프 정지
  ------------------------------------------ */

  if (
    forestGame.animationId
  ) {

    cancelAnimationFrame(
      forestGame.animationId
    );

    forestGame.animationId =
      null;

  }


  /* ------------------------------------------
     숲 화면 제거
  ------------------------------------------ */

  if (
    forestGame.screen
  ) {

    forestGame.screen.remove();

    forestGame.screen =
      null;

  }


  /* ------------------------------------------
     상태 초기화
  ------------------------------------------ */

  forestGame.player =
    null;

  forestGame.currentRoom =
    null;

  forestGame.roomHistory =
    [];

  forestGame.depth =
    0;

  forestGame.playerX =
    50;

  forestGame.playerY =
    50;

  forestGame.keys =
    {};

  forestGame.forestNumber =
    null;

  forestGame.shelterName =
    "";

}


/* ==================================================
   숲 게임 CSS
================================================== */

function addForestGameStyle() {

  /*
    이미 CSS가 있다면 다시 만들지 않음
  */

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


  /*
    반드시 백틱으로 CSS 전체를 감쌉니다.
  */

  style.innerHTML = `

    /* ==========================================
       전체 화면
    ========================================== */

    #forest-game-screen {

      position: fixed;

      inset: 0;

      z-index: 9999;

      width: 100vw;

      height: 100vh;

      color: white;

      font-family: sans-serif;

    }


    /* ==========================================
       숲 전체
    ========================================== */

    .forest-game {

      position: relative;

      width: 100%;

      height: 100%;

      overflow: hidden;

      background:

        radial-gradient(

          ellipse at center,

          #465a3d 0%,

          #263522 55%,

          #172116 100%

        );

    }


    /* ==========================================
       상단 정보
    ========================================== */

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

      background:

        rgba(0, 0, 0, 0.35);

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


    /* ==========================================
       나가기 버튼
    ========================================== */

    .forest-exit-button {

      border: none;

      border-radius: 8px;

      padding: 8px 13px;

      background:

        rgba(255, 255, 255, 0.15);

      color: white;

      cursor: pointer;

      font-size: 13px;

    }


    .forest-exit-button:hover {

      background:

        rgba(255, 255, 255, 0.25);

    }


    /* ==========================================
       숲 공간
    ========================================== */

    .forest-room {

      position: absolute;

      left: 0;

      right: 0;

      top: 55px;

      bottom: 45px;

      overflow: hidden;

    }


    /* ==========================================
       중앙 공간
    ========================================== */

    .forest-room::before {

      content: "";

      position: absolute;

      left: 50%;

      top: 50%;

      width: 42%;

      height: 42%;

      transform:

        translate(-50%, -50%);

      border-radius: 50%;

      background:

        rgba(88, 112, 70, 0.18);

      box-shadow:

        0 0 80px

        rgba(0, 0, 0, 0.35);

      pointer-events: none;

    }


    /* ==========================================
       방향 입구 공통
    ========================================== */

    .forest-entrance {

      position: absolute;

      background:

        rgba(10, 15, 10, 0.75);

      box-shadow:

        inset 0 0 30px

        rgba(0, 0, 0, 0.85),

        0 0 25px

        rgba(0, 0, 0, 0.3);

      pointer-events: none;

      z-index: 2;

    }


    /* ==========================================
       위쪽 반타원
    ========================================== */

    .forest-up {

      left: 50%;

      top: 2%;

      width: 160px;

      height: 80px;

      transform:

        translateX(-50%);

      border-radius:

        80px 80px 0 0;

    }


    /* ==========================================
       왼쪽 반타원
    ========================================== */

    .forest-left {

      left: 2%;

      top: 50%;

      width: 80px;

      height: 160px;

      transform:

        translateY(-50%);

      border-radius:

        0 80px 80px 0;

    }


    /* ==========================================
       오른쪽 반타원
    ========================================== */

    .forest-right {

      right: 2%;

      top: 50%;

      width: 80px;

      height: 160px;

      transform:

        translateY(-50%);

      border-radius:

        80px 0 0 80px;

    }


    /* ==========================================
       아래쪽 반타원
    ========================================== */

    .forest-down {

      left: 50%;

      bottom: 2%;

      width: 160px;

      height: 80px;

      transform:

        translateX(-50%);

      border-radius:

        0 0 80px 80px;

    }


    /* ==========================================
       임시 캐릭터
    ========================================== */

    .forest-player {

      position: absolute;

      width: 30px;

      height: 30px;

      transform:

        translate(-50%, -50%);

      border-radius: 50%;

      background: #ffffff;

      border: 3px solid #111111;

      box-sizing: border-box;

      z-index: 5;

      box-shadow:

        0 0 12px

        rgba(255, 255, 255, 0.5);

    }


    /* ==========================================
       안내 문구
    ========================================== */

    .forest-message {

      position: absolute;

      left: 50%;

      bottom: 12px;

      transform:

        translateX(-50%);

      z-index: 10;

      padding: 6px 12px;

      border-radius: 8px;

      background:

        rgba(0, 0, 0, 0.45);

      color: #e5e5e5;

      font-size: 12px;

      pointer-events: none;

      white-space: nowrap;

    }

  `;


  /*
    여기까지가 CSS 문자열입니다.
    이 백틱이 반드시 있어야 합니다.
  */

  document.head.appendChild(
    style
  );

}


/* ==================================================
   파일 로드 확인
================================================== */

console.log(
  "forest.js 로드 성공"
);
