/* ==================================================
   숲 탐험 게임
   forest.js
================================================== */


/* ==================================================
   이미지 파일 설정
================================================== */

const FOREST_NORMAL_IMAGE = "./forest-normal.png";
const FOREST_DEEP_IMAGE = "./forest-deep.png";
const PLAYER_IMAGE = "./2112.png";


/* ==================================================
   몬스터 데이터
================================================== */

const MONSTER_LIST = [
  { name: "티거", img: PLAYER_IMAGE },
  { name: "티거", img: PLAYER_IMAGE },
  { name: "티거", img: PLAYER_IMAGE },
  { name: "티거", img: PLAYER_IMAGE }
];


/* ==================================================
   보물상자 보상
================================================== */

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

  // 현재 깊이
  depth: 0,

  // 현재 방
  currentRoom: null,

  // 지나온 방
  roomHistory: [],

  // 게임 화면
  screen: null,

  // 플레이어 DOM
  player: null,

  // 플레이어 위치
  playerX: 50,
  playerY: 50,

  // 키 입력
  keys: {},

  // 게임 루프
  animationId: null,

  // 숲 정보
  forestNumber: null,
  shelterName: "",

  // 현재 접근한 오브젝트
  nearObject: null
};


/* ==================================================
   HTML 이스케이프
================================================== */

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


/* ==================================================
   반대 방향
================================================== */

function getOppositeDirection(direction) {

  const oppositeMap = {
    left: "right",
    right: "left",
    up: "down",
    down: "up"
  };

  return oppositeMap[direction] || null;
}


/* ==================================================
   숲 방 생성
==================================================

   중요:
   이 함수는 방을 "처음 만들 때만" 실행됩니다.

   이후 같은 방을 다시 방문하면
   기존 방을 그대로 사용합니다.

================================================== */

function createForestRoom(parentDirection, isSpecialTreeRoom = false) {

  const room = {

    // 이 방으로 들어온 방향
    parentDirection: parentDirection,

    // 출구
    exits: {
      left: false,
      right: false,
      up: false,
      down: false
    },

    // 이 방에서 연결된 다른 방
    children: {
      left: null,
      right: null,
      up: null,
      down: null
    },

    // 나무
    tree: null,

    // 보물상자
    chest: null,

    // 특수 나무가 있는 방향
    specialTreeDirection: null
  };


  /* ------------------------------------------------
     부모 방으로 돌아가는 출구
  ------------------------------------------------ */

  const opposite = getOppositeDirection(parentDirection);

  if (opposite) {
    room.exits[opposite] = true;
  }


  /* ------------------------------------------------
     더 깊은 숲 출구 생성
  ------------------------------------------------ */

  const deeperForestProbability = 0.25;

  const possibleDirections = [
    "left",
    "right",
    "up",
    "down"
  ];


  for (const direction of possibleDirections) {

    // 부모 방으로 돌아가는 방향은 제외
    if (direction === opposite) {
      continue;
    }

    if (Math.random() < deeperForestProbability) {
      room.exits[direction] = true;
    }
  }


  /* ------------------------------------------------
     최소한 하나의 새로운 방향은 존재하도록 처리
  ------------------------------------------------ */

  const newDirections = possibleDirections.filter(function(direction) {

    return (
      direction !== opposite &&
      room.exits[direction] === true
    );

  });


  /* ------------------------------------------------
     특수 나무 방 방향
  ------------------------------------------------ */

  if (newDirections.length > 0) {

    const randomIndex =
      Math.floor(Math.random() * newDirections.length);

    room.specialTreeDirection =
      newDirections[randomIndex];
  }


  /* ------------------------------------------------
     특수 나무
  ------------------------------------------------ */

  if (isSpecialTreeRoom) {

    room.tree = {
      x: 50,
      y: 50,
      visited: false
    };
  }


  /* ------------------------------------------------
     보물상자
  ------------------------------------------------ */

  if (Math.random() < 0.35) {

    const corners = [

      { x: 15, y: 15 },
      { x: 85, y: 15 },
      { x: 15, y: 85 },
      { x: 85, y: 85 }

    ];

    const chosenCorner =
      corners[Math.floor(Math.random() * corners.length)];

    room.chest = {

      x: chosenCorner.x,
      y: chosenCorner.y,

      opened: false

    };
  }


  return room;
}


/* ==================================================
   첫 번째 숲 방 생성
================================================== */

function createFirstForestRoom() {

  const room = {

    parentDirection: null,

    exits: {
      left: true,
      right: true,
      up: true,
      down: false
    },

    children: {
      left: null,
      right: null,
      up: null,
      down: null
    },

    tree: null,

    chest: null,

    specialTreeDirection: null
  };


  /* ------------------------------------------------
     첫 숲의 세 방향 중 하나를 특수 나무 방으로 지정
  ------------------------------------------------ */

  const directions = [
    "left",
    "right",
    "up"
  ];

  const randomIndex =
    Math.floor(Math.random() * directions.length);

  room.specialTreeDirection =
    directions[randomIndex];


  return room;
}


/* ==================================================
   숲 진입
================================================== */

function enterForest(forestNumber, shelterName) {

  console.log(
    "숲 탐험 시작:",
    forestNumber,
    shelterName
  );


  /* ------------------------------------------------
     기존 숲이 있다면 종료
  ------------------------------------------------ */

  if (forestGame.screen) {
    exitForestGame();
  }


  /* ------------------------------------------------
     상태 초기화
  ------------------------------------------------ */

  forestGame.depth = 0;

  forestGame.roomHistory = [];

  forestGame.playerX = 50;
  forestGame.playerY = 50;

  forestGame.forestNumber = forestNumber;

  forestGame.shelterName = shelterName;

  forestGame.nearObject = null;


  /* ------------------------------------------------
     첫 번째 방
  ------------------------------------------------ */

  forestGame.currentRoom =
    createFirstForestRoom();


  /* ------------------------------------------------
     게임 화면 생성
  ------------------------------------------------ */

  const screen =
    document.createElement("div");

  screen.id = "forest-game-screen";


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


        <img
          id="forest-player"
          class="forest-player"
          src="${PLAYER_IMAGE}"
          alt="플레이어"
        />

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
            alt="보상 이미지"
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
    document.getElementById("forest-player");


  /* ------------------------------------------------
     CSS 및 게임 시작
  ------------------------------------------------ */

  addForestGameStyle();

  startForestKeyboard();

  renderForestRoom();

  forestGameLoop();
}


/* ==================================================
   현재 방 렌더링
================================================== */

function renderForestRoom() {

  const room = forestGame.currentRoom;

  if (!room) {
    return;
  }


  /* ------------------------------------------------
     숲 배경 변경

     depth 0 = 일반 숲
     depth 1 이상 = 깊은 숲
  ------------------------------------------------ */

  const forestRoom =
    document.getElementById("forest-room");

  if (forestRoom) {

    if (forestGame.depth === 0) {

      forestRoom.style.backgroundImage =
        `url("${FOREST_NORMAL_IMAGE}")`;

    } else {

      forestRoom.style.backgroundImage =
        `url("${FOREST_DEEP_IMAGE}")`;

    }
  }


  /* ------------------------------------------------
     출구 표시
  ------------------------------------------------ */

  const up =
    document.getElementById("forest-up");

  const down =
    document.getElementById("forest-down");

  const left =
    document.getElementById("forest-left");

  const right =
    document.getElementById("forest-right");


  if (up) {
    up.style.display =
      room.exits.up ? "block" : "none";
  }

  if (down) {
    down.style.display =
      room.exits.down ? "block" : "none";
  }

  if (left) {
    left.style.display =
      room.exits.left ? "block" : "none";
  }

  if (right) {
    right.style.display =
      room.exits.right ? "block" : "none";
  }


  /* ------------------------------------------------
     나무
  ------------------------------------------------ */

  const treeEl =
    document.getElementById("forest-tree");


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


  /* ------------------------------------------------
     보물상자
  ------------------------------------------------ */

  const chestEl =
    document.getElementById("forest-chest");


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
    "ArrowRight",
    "Shift"

  ];


  if (allowedKeys.includes(event.key)) {

    event.preventDefault();

    forestGame.keys[event.key] = true;


    if (event.key === "Shift") {

      checkInteraction();

    }
  }
}


/* ==================================================
   키 떼기
================================================== */

function forestKeyUp(event) {

  const allowedKeys = [

    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "Shift"

  ];


  if (allowedKeys.includes(event.key)) {

    forestGame.keys[event.key] = false;

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

  checkObjectProximity();


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


/* ==================================================
   플레이어 위치 표시
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
   오브젝트 접근 확인
================================================== */

function checkObjectProximity() {

  const room =
    forestGame.currentRoom;

  const msgEl =
    document.getElementById(
      "forest-message"
    );


  if (!room || !msgEl) {
    return;
  }


  const threshold = 8;

  let near = null;


  /* ------------------------------------------------
     나무
  ------------------------------------------------ */

  if (room.tree) {

    const distance =
      Math.hypot(

        forestGame.playerX -
          room.tree.x,

        forestGame.playerY -
          room.tree.y

      );


    if (distance < threshold) {

      near = "tree";

    }
  }


  /* ------------------------------------------------
     보물상자
  ------------------------------------------------ */

  if (
    !near &&
    room.chest &&
    !room.chest.opened
  ) {

    const distance =
      Math.hypot(

        forestGame.playerX -
          room.chest.x,

        forestGame.playerY -
          room.chest.y

      );


    if (distance < threshold) {

      near = "chest";

    }
  }


  forestGame.nearObject = near;


  /* ------------------------------------------------
     안내 문구
  ------------------------------------------------ */

  if (near === "tree") {

    msgEl.innerText =
      "[Shift 키] 또는 [클릭]하여 나무 조사하기";

    msgEl.classList.add("highlight");

  } else if (near === "chest") {

    msgEl.innerText =
      "[Shift 키] 또는 [클릭]하여 보물상자 열기";

    msgEl.classList.add("highlight");

  } else {

    msgEl.innerText =
      "방향키로 이동하십시오.";

    msgEl.classList.remove("highlight");

  }
}


/* ==================================================
   상호작용
================================================== */

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


/* ==================================================
   나무 조사
================================================== */

function interactTree() {

  const room =
    forestGame.currentRoom;


  if (!room || !room.tree) {
    return;
  }


  const randomMonster =
    MONSTER_LIST[
      Math.floor(
        Math.random() *
        MONSTER_LIST.length
      )
    ];


  room.tree.visited = true;


  showModal(

    randomMonster.img,

    `'${randomMonster.name}'을(를) 획득했다!`

  );
}


/* ==================================================
   보물상자
================================================== */

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


  const randomReward =
    CHEST_REWARDS[
      Math.floor(
        Math.random() *
        CHEST_REWARDS.length
      )
    ];


  /*
     외부 placeholder 이미지 사용 안 함.
     보물상자 자체를 CSS/이모지로 표시합니다.
  */

  showModal(

    "",

    `보물상자에서 [${randomReward}]을(를) 획득했습니다!`

  );
}


/* ==================================================
   모달
================================================== */

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
    modal &&
    modalImg &&
    modalText
  ) {

    if (imgUrl) {

      modalImg.src = imgUrl;

      modalImg.style.display =
        "block";

    } else {

      modalImg.style.display =
        "none";

    }


    modalText.innerText = text;

    modal.style.display =
      "flex";
  }
}


/* ==================================================
   모달 닫기
================================================== */

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


/* ==================================================
   숲 경계 확인
================================================== */

function checkForestBoundary() {

  const edge = 5;

  const room =
    forestGame.currentRoom;


  if (!room) {
    return;
  }


  /* =================================================
     위쪽
  ================================================= */

  if (forestGame.playerY <= edge) {

    forestGame.playerY = edge;


    if (room.exits.up) {

      /*
         현재 방의 부모 방향이 down이라면
         위쪽으로 들어온 방이므로
         위쪽으로 돌아갈 때 부모 방으로 이동합니다.
      */

      if (
        room.parentDirection === "down"
      ) {

        moveBackOrExit();

      } else {

        enterDeeperForest("up");

      }

      return;
    }
  }


  /* =================================================
     아래쪽
  ================================================= */

  if (
    forestGame.playerY >=
    100 - edge
  ) {

    forestGame.playerY =
      100 - edge;


    /*
       첫 번째 숲의 아래쪽은
       무조건 지도으로 돌아갑니다.
    */

    if (forestGame.depth === 0) {

      exitForestGame();

      return;
    }


    /*
       깊은 숲에서는
       현재 방으로 들어온 방향의 반대 방향이면
       부모 숲으로 돌아갑니다.

       예:
       위쪽으로 들어왔다면
       아래쪽 → 부모 숲

       왼쪽으로 들어왔다면
       오른쪽 → 부모 숲
    */

    if (
      room.parentDirection === "up"
    ) {

      moveBackOrExit();

      return;
    }


    if (room.exits.down) {

      enterDeeperForest("down");

      return;
    }
  }


  /* =================================================
     왼쪽
  ================================================= */

  if (forestGame.playerX <= edge) {

    forestGame.playerX = edge;


    if (room.exits.left) {

      if (
        room.parentDirection === "right"
      ) {

        moveBackOrExit();

      } else {

        enterDeeperForest("left");

      }

      return;
    }
  }


  /* =================================================
     오른쪽
  ================================================= */

  if (
    forestGame.playerX >=
    100 - edge
  ) {

    forestGame.playerX =
      100 - edge;


    if (room.exits.right) {

      if (
        room.parentDirection === "left"
      ) {

        moveBackOrExit();

      } else {

        enterDeeperForest("right");

      }

      return;
    }
  }
}


/* ==================================================
   더 깊은 숲으로 이동
================================================== */

function enterDeeperForest(direction) {

  const currentRoom =
    forestGame.currentRoom;


  if (!currentRoom) {
    return;
  }


  forestGame.keys = {};


  /* ------------------------------------------------
     특수 나무 방인지 확인
  ------------------------------------------------ */

  const isSpecialTreeRoom =

    currentRoom.specialTreeDirection ===
    direction;


  /* ------------------------------------------------
     현재 방을 기록
  ------------------------------------------------ */

  forestGame.roomHistory.push(
    currentRoom
  );


  /* ------------------------------------------------
     중요:
     이미 만들어진 방이면 그대로 사용합니다.

     처음 가는 방향:
     새 방 생성

     다시 가는 방향:
     기존 방 사용

     따라서 랜덤 확률도 한 번만 적용됩니다.
  ------------------------------------------------ */

  if (
    currentRoom.children[direction]
  ) {

    forestGame.currentRoom =
      currentRoom.children[direction];

  } else {

    const newRoom =
      createForestRoom(
        direction,
        isSpecialTreeRoom
      );


    currentRoom.children[direction] =
      newRoom;


    forestGame.currentRoom =
      newRoom;
  }


  /* ------------------------------------------------
     깊이 증가
  ------------------------------------------------ */

  forestGame.depth++;


  /* ------------------------------------------------
     새 방의 시작 위치
  ------------------------------------------------ */

  if (direction === "up") {

    forestGame.playerX = 50;
    forestGame.playerY = 90;

  } else if (direction === "down") {

    forestGame.playerX = 50;
    forestGame.playerY = 10;

  } else if (direction === "left") {

    forestGame.playerX = 90;
    forestGame.playerY = 50;

  } else if (direction === "right") {

    forestGame.playerX = 10;
    forestGame.playerY = 50;

  }


  renderForestRoom();
}


/* ==================================================
   이전 숲으로 돌아가기
================================================== */

function moveBackOrExit() {

  forestGame.keys = {};


  /* ------------------------------------------------
     첫 번째 숲이라면 지도으로 나가기
  ------------------------------------------------ */

  if (
    forestGame.depth === 0 ||
    forestGame.roomHistory.length === 0
  ) {

    exitForestGame();

    return;
  }


  /* ------------------------------------------------
     현재 방으로 들어왔던 방향
  ------------------------------------------------ */

  const enteredDirection =
    forestGame.currentRoom.parentDirection;


  /* ------------------------------------------------
     부모 방 가져오기
  ------------------------------------------------ */

  const previousRoom =
    forestGame.roomHistory.pop();


  forestGame.currentRoom =
    previousRoom;


  forestGame.depth--;


  /* ------------------------------------------------
     부모 방에서 플레이어가 나타날 위치

     현재 방으로 들어왔던 방향의 반대쪽입니다.
  ------------------------------------------------ */

  const returnDirection =
    getOppositeDirection(
      enteredDirection
    );


  if (returnDirection === "up") {

    forestGame.playerX = 50;
    forestGame.playerY = 10;

  } else if (returnDirection === "down") {

    forestGame.playerX = 50;
    forestGame.playerY = 90;

  } else if (returnDirection === "left") {

    forestGame.playerX = 10;
    forestGame.playerY = 50;

  } else if (returnDirection === "right") {

    forestGame.playerX = 90;
    forestGame.playerY = 50;

  }


  renderForestRoom();
}


/* ==================================================
   숲에서 나가기
================================================== */

function exitForestGame() {

  console.log("숲에서 나갑니다.");


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


/* ==================================================
   숲 게임 CSS
================================================== */

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

      background: #172116;

    }


    /* ==========================================
       실제 숲 이미지가 들어가는 영역
    ========================================== */

    .forest-room {

      position: absolute;

      left: 0;

      right: 0;

      top: 55px;

      bottom: 45px;

      overflow: hidden;

      background-position: center;

      background-size: cover;

      background-repeat: no-repeat;

      transition:
        background-image 0.25s ease;

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

      z-index: 20;

      background:
        rgba(0, 0, 0, 0.45);

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
       숲 출입구
    ========================================== */

    .forest-entrance {

      position: absolute;

      background:
        rgba(10, 15, 10, 0.75);

      box-shadow:
        inset 0 0 30px rgba(0, 0, 0, 0.85),
        0 0 25px rgba(0, 0, 0, 0.3);

      pointer-events: none;

      z-index: 4;

    }


    .forest-up {

      left: 50%;

      top: 0;

      width: 160px;

      height: 70px;

      transform:
        translateX(-50%);

      border-radius:
        0 0 80px 80px;

    }


    .forest-left {

      left: 0;

      top: 50%;

      width: 70px;

      height: 160px;

      transform:
        translateY(-50%);

      border-radius:
        0 80px 80px 0;

    }


    .forest-right {

      right: 0;

      top: 50%;

      width: 70px;

      height: 160px;

      transform:
        translateY(-50%);

      border-radius:
        80px 0 0 80px;

    }


    .forest-down {

      left: 50%;

      bottom: 0;

      width: 160px;

      height: 70px;

      transform:
        translateX(-50%);

      border-radius:
        80px 80px 0 0;

    }


    /* ==========================================
       나무 / 보물상자
    ========================================== */

    .forest-object {

      position: absolute;

      font-size: 40px;

      transform:
        translate(-50%, -50%);

      cursor: pointer;

      z-index: 8;

      user-select: none;

      transition:
        transform 0.2s;

    }


    .forest-object:hover {

      transform:
        translate(-50%, -50%)
        scale(1.2);

    }


    /* ==========================================
       플레이어
    ========================================== */

    .forest-player {

      position: absolute;

      width: 42px;

      height: 42px;

      object-fit: contain;

      transform:
        translate(-50%, -50%);

      z-index: 10;

      user-select: none;

      pointer-events: none;

      image-rendering: pixelated;

      filter:
        drop-shadow(
          0 2px 4px
          rgba(0, 0, 0, 0.7)
        );

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

      z-index: 20;

      padding: 6px 12px;

      border-radius: 8px;

      background:
        rgba(0, 0, 0, 0.55);

      color: #e5e5e5;

      font-size: 12px;

      pointer-events: none;

      white-space: nowrap;

      transition:
        all 0.3s;

    }


    .forest-message.highlight {

      background:
        rgba(255, 193, 7, 0.9);

      color: #111;

      font-weight: bold;

    }


    /* ==========================================
       팝업
    ========================================== */

    .forest-modal {

      position: absolute;

      inset: 0;

      background:
        rgba(0, 0, 0, 0.72);

      z-index: 100;

      display: flex;

      justify-content: center;

      align-items: center;

    }


    .forest-modal-content {

      background: #2a3a27;

      border:
        2px solid #81c784;

      padding: 24px;

      border-radius: 12px;

      text-align: center;

      box-shadow:
        0 0 20px
        rgba(0, 0, 0, 0.8);

      max-width: 280px;

      width: 80%;

    }


    .modal-img {

      width: 120px;

      height: 120px;

      object-fit: contain;

      image-rendering: pixelated;

      border-radius: 8px;

      margin-bottom: 12px;

      border:
        2px solid white;

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


/* ==================================================
   forest.js 로드 확인
================================================== */

console.log("forest.js 로드 성공");
