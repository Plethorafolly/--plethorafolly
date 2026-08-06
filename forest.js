/* ==================================================
   숲 탐험 게임
   forest.js
================================================== */


/* ==================================================
   몬스터 데이터
   나무를 조사했을 때 이 목록에서 하나가 무작위로 선택됩니다.
================================================== */

const MONSTER_LIST = [
  {
    name: "티거",
    img: "./2112.png"
  }

  // 몬스터를 추가하려면 아래처럼 추가하십시오.
  // {
  //   name: "몬스터 이름",
  //   img: "./monster2.png"
  // }
];


/* ==================================================
   보물상자 보상 목록
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
  depth: 0,

  // 현재 방
  currentRoom: null,

  // 이전 방을 저장하는 스택
  roomHistory: [],

  // 게임 화면
  screen: null,

  // 플레이어
  player: null,

  playerX: 50,
  playerY: 50,

  // 키 입력
  keys: {},

  // 애니메이션
  animationId: null,

  // 숲 정보
  forestNumber: null,
  shelterName: "",

  // 현재 가까이 있는 오브젝트
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
  const opposite = {
    left: "right",
    right: "left",
    up: "down",
    down: "up"
  };

  return opposite[direction] || null;
}


/* ==================================================
   숲 방 생성
==================================================

   중요한 점:

   각 방은 exits만 저장하는 것이 아니라
   connections에 실제 연결된 방을 저장합니다.

   따라서 한 번 생성된 숲은 다시 방문해도
   새로운 숲으로 바뀌지 않습니다.
================================================== */

function createForestRoom(parentDirection, isSpecialTreeRoom = false) {

  const room = {

    // 이 방으로 들어온 방향
    parentDirection: parentDirection,

    // 출구 존재 여부
    exits: {
      left: false,
      right: false,
      up: false,
      down: false
    },

    // 실제 연결된 방
    connections: {
      left: null,
      right: null,
      up: null,
      down: null
    },

    // 중앙 나무
    tree: null,

    // 보물상자
    chest: null,

    // 이 방에서 새로 생성될 숲의 방향
    specialTreeDirection: null
  };


  /* --------------------------------------------------
     이전 방으로 돌아가는 길
  -------------------------------------------------- */

  const opposite = getOppositeDirection(parentDirection);

  if (opposite) {
    room.exits[opposite] = true;
  }


  /* --------------------------------------------------
     새로운 깊은 숲으로 갈 수 있는 방향 생성
     
     부모 방향과 반대되는 방향은 제외합니다.
  -------------------------------------------------- */

  const deeperForestProbability = 0.25;

  const possibleDirections = [
    "left",
    "right",
    "up",
    "down"
  ];

  const availableDirections = [];


  for (const direction of possibleDirections) {

    // 현재 들어온 방향의 반대 방향은
    // 이미 이전 숲으로 돌아가는 길이므로 제외합니다.
    if (direction === opposite) {
      continue;
    }

    if (Math.random() < deeperForestProbability) {

      room.exits[direction] = true;

      availableDirections.push(direction);
    }
  }


  /* --------------------------------------------------
     새로운 숲 중 한 곳을 나무 방으로 지정
     
     단, 실제 나무는 다음 방에 들어갈 때 생성됩니다.
  -------------------------------------------------- */

  if (availableDirections.length > 0) {

    const randomIndex =
      Math.floor(Math.random() * availableDirections.length);

    room.specialTreeDirection =
      availableDirections[randomIndex];
  }


  /* --------------------------------------------------
     특수 나무 방
     
     이 방 자체가 나무 방이라면
     화면 중앙에 나무를 하나 확정적으로 생성합니다.
  -------------------------------------------------- */

  if (isSpecialTreeRoom) {

    room.tree = {
      x: 50,
      y: 50,
      visited: false
    };
  }


  /* --------------------------------------------------
     보물상자
     
     일반 숲(depth 0)에는 생성하지 않습니다.

     깊은 숲(depth 1 이상)에 해당하는 방에서만
     확률적으로 생성됩니다.
     
     현재 방의 깊이는 enterDeeperForest()에서
     depth를 증가시키기 전에 생성되므로
     여기서는 depth와 관계없이,
     깊은 숲으로 진입하는 방에서 호출될 때만
     보물상자를 생성하도록 합니다.
  -------------------------------------------------- */

  if (parentDirection !== null && Math.random() < 0.35) {

    const corners = [

      { x: 12, y: 12 },
      { x: 88, y: 12 },
      { x: 12, y: 88 },
      { x: 88, y: 88 }

    ];

    const selectedCorner =
      corners[Math.floor(Math.random() * corners.length)];

    room.chest = {

      x: selectedCorner.x,
      y: selectedCorner.y,

      opened: false
    };
  }


  return room;
}


/* ==================================================
   최초 숲 방 생성
================================================== */

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


  /* --------------------------------------------------
     최초 숲의 세 방향 중 한 곳은
     반드시 나무가 있는 깊은 숲으로 연결됩니다.
  -------------------------------------------------- */

  const directions = [
    "left",
    "right",
    "up"
  ];

  const randomIndex =
    Math.floor(Math.random() * directions.length);

  firstRoom.specialTreeDirection =
    directions[randomIndex];


  return firstRoom;
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


  /* --------------------------------------------------
     이미 숲이 열려 있다면 먼저 종료
  -------------------------------------------------- */

  if (forestGame.screen) {
    exitForestGame();
  }


  /* --------------------------------------------------
     게임 상태 초기화
  -------------------------------------------------- */

  forestGame.depth = 0;

  forestGame.roomHistory = [];

  forestGame.playerX = 50;
  forestGame.playerY = 50;

  forestGame.forestNumber = forestNumber;

  forestGame.shelterName = shelterName;

  forestGame.nearObject = null;


  /* --------------------------------------------------
     최초 숲 생성
  -------------------------------------------------- */

  forestGame.currentRoom =
    createFirstForestRoom();


  /* --------------------------------------------------
     게임 화면 생성
  -------------------------------------------------- */

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


        <!-- 나무 -->

        <div
          id="forest-tree"
          class="forest-object forest-tree"
          onclick="interactTree()"
          style="display:none;"
        >
          🌳
        </div>


        <!-- 보물상자 -->

        <div
          id="forest-chest"
          class="forest-object forest-chest"
          onclick="interactChest()"
          style="display:none;"
        >
          🎁
        </div>


        <!-- 플레이어 -->

        <div
          id="forest-player"
          class="forest-player"
        ></div>

      </div>


      <!-- 안내 문구 -->

      <div
        id="forest-message"
        class="forest-message"
      >
        방향키로 이동하십시오.
      </div>


      <!-- 획득 팝업 -->

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
    document.getElementById("forest-player");


  addForestGameStyle();

  startForestKeyboard();

  renderForestRoom();

  forestGameLoop();
}


/* ==================================================
   현재 방 렌더링
================================================== */

function renderForestRoom() {

  const room =
    forestGame.currentRoom;

  if (!room) {
    return;
  }


  /* --------------------------------------------------
     출구
  -------------------------------------------------- */

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


  /* --------------------------------------------------
     나무
  -------------------------------------------------- */

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


  /* --------------------------------------------------
     보물상자
  -------------------------------------------------- */

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

  checkObjectProximity();
}


/* ==================================================
   키보드 시작
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
   키보드 종료
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
   키 다운
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


  if (!allowedKeys.includes(event.key)) {
    return;
  }


  event.preventDefault();

  forestGame.keys[event.key] = true;


  /* --------------------------------------------------
     Shift를 누르면 오브젝트 조사
  -------------------------------------------------- */

  if (event.key === "Shift") {
    checkInteraction();
  }
}


/* ==================================================
   키 업
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

  const message =
    document.getElementById(
      "forest-message"
    );


  if (!room || !message) {
    return;
  }


  const threshold = 8;

  let near = null;


  /* --------------------------------------------------
     나무
  -------------------------------------------------- */

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


  /* --------------------------------------------------
     보물상자
  -------------------------------------------------- */

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


  /* --------------------------------------------------
     안내 문구
  -------------------------------------------------- */

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


  /* --------------------------------------------------
     몬스터 무작위 선택
  -------------------------------------------------- */

  const randomIndex =
    Math.floor(
      Math.random() *
      MONSTER_LIST.length
    );


  const monster =
    MONSTER_LIST[randomIndex];


  /* --------------------------------------------------
     나무 조사 후 팝업
  -------------------------------------------------- */

  showModal(
    monster.img,
    `"${monster.name}"을(를) 획득했다!`
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


  /* --------------------------------------------------
     이미 열린 상자로 변경
  -------------------------------------------------- */

  room.chest.opened = true;


  const chestEl =
    document.getElementById(
      "forest-chest"
    );


  if (chestEl) {
    chestEl.innerText = "📦";
  }


  /* --------------------------------------------------
     보상 무작위 선택
  -------------------------------------------------- */

  const randomIndex =
    Math.floor(
      Math.random() *
      CHEST_REWARDS.length
    );


  const reward =
    CHEST_REWARDS[randomIndex];


  /* --------------------------------------------------
     임시 이미지 링크는 사용하지 않습니다.
     
     아직 보물상자 이미지를 지정하지 않았으므로
     팝업에는 보물상자 이모지를 사용합니다.
  -------------------------------------------------- */

  showModal(
    "",
    `보물상자에서 [${reward}]을(를) 획득했습니다!`
  );
}


/* ==================================================
   팝업 출력
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


  modalText.innerText = text;

  modal.style.display =
    "flex";
}


/* ==================================================
   팝업 닫기
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


  /* ==================================================
     위쪽
  ================================================== */

  if (forestGame.playerY <= edge) {

    forestGame.playerY = edge;


    if (room.exits.up) {

      handleDirection("up");
    }
  }


  /* ==================================================
     아래쪽

     매우 중요:

     depth === 0이고 아래 출구가 없으면
     지도 화면으로 돌아갑니다.

     깊은 숲에서는 아래쪽으로 이동했을 때
     부모 방으로 돌아갑니다.
  ================================================== */

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

      /* 최초 숲에서만 지도으로 돌아감 */

      exitForestGame();

      return;
    }
  }


  /* ==================================================
     왼쪽
  ================================================== */

  if (forestGame.playerX <= edge) {

    forestGame.playerX = edge;


    if (room.exits.left) {

      handleDirection("left");
    }
  }


  /* ==================================================
     오른쪽
  ================================================== */

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


/* ==================================================
   방향 이동 처리
================================================== */

function handleDirection(direction) {

  const room =
    forestGame.currentRoom;


  if (!room) {
    return;
  }


  /* --------------------------------------------------
     이미 연결된 방이 있다면
     절대로 새 방을 만들지 않습니다.
     
     이것이 기존 코드와 가장 중요한 차이입니다.
  -------------------------------------------------- */

  if (
    room.connections[direction]
  ) {

    moveToExistingRoom(
      direction
    );

    return;
  }


  /* --------------------------------------------------
     아직 생성되지 않은 방향이라면
     새로운 방을 생성합니다.
  -------------------------------------------------- */

  enterDeeperForest(
    direction
  );
}


/* ==================================================
   새로운 깊은 숲으로 이동
================================================== */

function enterDeeperForest(direction) {

  const currentRoom =
    forestGame.currentRoom;


  if (!currentRoom) {
    return;
  }


  forestGame.keys = {};


  /* --------------------------------------------------
     현재 방에서 해당 방향으로 이동할 때
     나무 방으로 지정되어 있었는지 확인
  -------------------------------------------------- */

  const isSpecialTreeRoom =
    currentRoom.specialTreeDirection ===
    direction;


  /* --------------------------------------------------
     새로운 방 생성
  -------------------------------------------------- */

  const newRoom =
    createForestRoom(
      direction,
      isSpecialTreeRoom
    );


  /* --------------------------------------------------
     양쪽 방을 서로 연결
     
     현재 방 → 새 방
     새 방 → 현재 방
     
     이후 다시 돌아왔을 때
     기존 방을 그대로 사용합니다.
  -------------------------------------------------- */

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


  /* --------------------------------------------------
     현재 방을 history에 저장
  -------------------------------------------------- */

  forestGame.roomHistory.push(
    currentRoom
  );


  forestGame.depth++;


  forestGame.currentRoom =
    newRoom;


  /* --------------------------------------------------
     새 방에 들어온 위치
  -------------------------------------------------- */

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


/* ==================================================
   기존에 생성된 숲으로 이동
================================================== */

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


  /* --------------------------------------------------
     현재 방보다 한 단계 깊은 방으로 이동
  -------------------------------------------------- */

  if (
    targetRoom.parentDirection ===
    direction
  ) {

    forestGame.roomHistory.push(
      currentRoom
    );

    forestGame.depth++;

  } else {

    /* --------------------------------------------------
       기존 방으로 되돌아가는 경우
       
       history의 마지막 방을 제거합니다.
    -------------------------------------------------- */

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


  /* --------------------------------------------------
     이동한 방향에 따라
     플레이어 위치 설정
  -------------------------------------------------- */

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


/* ==================================================
   숲에서 나가기
================================================== */

function exitForestGame() {

  console.log(
    "숲에서 나갑니다."
  );


  stopForestKeyboard();


  /* --------------------------------------------------
     애니메이션 정지
  -------------------------------------------------- */

  if (forestGame.animationId) {

    cancelAnimationFrame(
      forestGame.animationId
    );

    forestGame.animationId =
      null;
  }


  /* --------------------------------------------------
     화면 제거
  -------------------------------------------------- */

  if (forestGame.screen) {

    forestGame.screen.remove();

    forestGame.screen =
      null;
  }


  /* --------------------------------------------------
     상태 초기화
  -------------------------------------------------- */

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

  forestGame.nearObject =
    null;
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
    document.createElement(
      "style"
    );


  style.id =
    "forest-game-style";


  style.innerHTML = `

    /* ==================================================
       전체 화면
    ================================================== */

    #forest-game-screen {

      position: fixed;

      inset: 0;

      z-index: 9999;

      width: 100vw;

      height: 100vh;

      color: white;

      font-family: sans-serif;
    }


    /* ==================================================
       숲 배경
    ================================================== */

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


    /* ==================================================
       상단
    ================================================== */

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


    /* ==================================================
       지도으로 돌아가기
    ================================================== */

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


    /* ==================================================
       방
    ================================================== */

    .forest-room {

      position: absolute;

      left: 0;

      right: 0;

      top: 55px;

      bottom: 45px;

      overflow: hidden;
    }


    /* ==================================================
       중앙 밝은 부분
    ================================================== */

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


    /* ==================================================
       숲 입구
    ================================================== */

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


    /* ==================================================
       나무 / 보물상자
    ================================================== */

    .forest-object {

      position: absolute;

      font-size: 40px;

      transform:
        translate(-50%, -50%);

      cursor: pointer;

      z-index: 4;

      user-select: none;

      transition:
        transform 0.2s;
    }


    .forest-object:hover {

      transform:
        translate(-50%, -50%)
        scale(1.2);
    }


    /* ==================================================
       플레이어
    ================================================== */

    .forest-player {

      position: absolute;

      width: 30px;

      height: 30px;

      transform:
        translate(-50%, -50%);

      border-radius: 50%;

      background: #ffffff;

      border:
        3px solid #111111;

      box-sizing: border-box;

      z-index: 5;

      box-shadow:
        0 0 12px
        rgba(255, 255, 255, 0.5);
    }


    /* ==================================================
       안내 문구
    ================================================== */

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

      transition:
        all 0.3s;
    }


    .forest-message.highlight {

      background:
        rgba(255, 193, 7, 0.85);

      color: #111;

      font-weight: bold;
    }


    /* ==================================================
       팝업
    ================================================== */

    .forest-modal {

      position: absolute;

      inset: 0;

      background:
        rgba(0, 0, 0, 0.7);

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

      border-radius: 8px;

      margin-bottom: 12px;

      border:
        2px solid #fff;
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


    .modal-close-btn:hover {

      background: #a5d6a7;
    }

  `;


  document.head.appendChild(style);
}


/* ==================================================
   forest.js 로드 확인
================================================== */

console.log(
  "forest.js 로드 성공"
);
