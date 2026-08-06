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

screen: null,

player: null,

playerX: 50,

playerY: 50,

keys: {},

animationId: null

};

// ==================================================
// 숲 공간 생성
// ==================================================

function createForestRoom(parentDirection) {

const room = {

```
parentDirection: parentDirection,

exits: {

  left: false,

  right: false,

  up: false,

  down: false

}
```

};

// ------------------------------------------
// 이전 숲으로 돌아가는 길
// ------------------------------------------

if (parentDirection === "left") {

```
room.exits.right = true;
```

}

else if (parentDirection === "right") {

```
room.exits.left = true;
```

}

else if (parentDirection === "up") {

```
room.exits.down = true;
```

}

// ------------------------------------------
// 더 깊은 숲이 존재할 확률
// ------------------------------------------

const deeperForestProbability = 0.25;

// 왼쪽

if (
parentDirection !== "left" &&
Math.random() < deeperForestProbability
) {

```
room.exits.left = true;
```

}

// 오른쪽

if (
parentDirection !== "right" &&
Math.random() < deeperForestProbability
) {

```
room.exits.right = true;
```

}

// 위쪽

if (
Math.random() < deeperForestProbability
) {

```
room.exits.up = true;
```

}

return room;

}

// ==================================================
// 숲 진입
// ==================================================

function enterForest(

forestNumber,

shelterName

) {

console.log(

```
"숲 탐험 시작:",

forestNumber,

shelterName
```

);

// 기존 게임 제거

if (forestGame.screen) {

```
forestGame.screen.remove();
```

}

if (forestGame.animationId) {

```
cancelAnimationFrame(
  forestGame.animationId
);
```

}

// ------------------------------------------
// 게임 초기화
// ------------------------------------------

forestGame.depth = 0;

forestGame.playerX = 50;

forestGame.playerY = 50;

forestGame.currentRoom = {

```
parentDirection: null,

exits: {

  left: true,

  right: true,

  up: true,

  down: true

}
```

};

// ------------------------------------------
// 게임 화면 생성
// ------------------------------------------

const screen =
document.createElement("div");

screen.id =
"forest-game-screen";

screen.innerHTML = `

```
<div class="forest-game">


  <!-- 상단 정보 -->

  <div class="forest-header">

    <div>

      <strong>
        숲 ${forestNumber}
      </strong>

      <span>
        ${escapeHtml(shelterName)}
      </span>

    </div>


    <button
      class="forest-exit-button"
      onclick="exitForestGame()"
    >
      나가기
    </button>

  </div>


  <!-- 숲 공간 -->

  <div
    id="forest-room"
    class="forest-room"
  >


    <!-- 방향 입구 -->

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


    <!-- 임시 캐릭터 -->

    <div
      id="forest-player"
      class="forest-player"
    ></div>


  </div>


  <!-- 안내 -->

  <div class="forest-message">

    방향키로 이동하십시오.

  </div>


</div>
```

`;

document.body.appendChild(
screen
);

forestGame.screen = screen;

forestGame.player =
document.getElementById(
"forest-player"
);

// CSS 추가

addForestGameStyle();

// 키보드 이벤트 시작

startForestKeyboard();

// 첫 공간 표시

renderForestRoom();

// 게임 루프 시작

forestGameLoop();

}

// ==================================================
// 숲 공간 표시
// ==================================================

function renderForestRoom() {

const room =
forestGame.currentRoom;

if (!room) {

```
return;
```

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

// ------------------------------------------
// 입구 표시 여부
// ------------------------------------------

up.style.display =
room.exits.up
? "block"
: "none";

left.style.display =
room.exits.left
? "block"
: "none";

right.style.display =
room.exits.right
? "block"
: "none";

down.style.display =
room.exits.down
? "block"
: "none";

// ------------------------------------------
// 플레이어 위치 초기화
// ------------------------------------------

forestGame.playerX = 50;

forestGame.playerY = 50;

updatePlayerPosition();

}

// ==================================================
// 키보드 입력 시작
// ==================================================

function startForestKeyboard() {

document.addEventListener(

```
"keydown",

forestKeyDown
```

);

document.addEventListener(

```
"keyup",

forestKeyUp
```

);

}

// ==================================================
// 키보드 입력 종료
// ==================================================

function stopForestKeyboard() {

document.removeEventListener(

```
"keydown",

forestKeyDown
```

);

document.removeEventListener(

```
"keyup",

forestKeyUp
```

);

forestGame.keys = {};

}

// ==================================================
// 키 눌림
// ==================================================

function forestKeyDown(event) {

if (!forestGame.screen) {

```
return;
```

}

if (

```
event.key === "ArrowUp" ||

event.key === "ArrowDown" ||

event.key === "ArrowLeft" ||

event.key === "ArrowRight"
```

) {

```
event.preventDefault();


forestGame.keys[
  event.key
] = true;
```

}

}

// ==================================================
// 키 뗌
// ==================================================

function forestKeyUp(event) {

if (

```
event.key === "ArrowUp" ||

event.key === "ArrowDown" ||

event.key === "ArrowLeft" ||

event.key === "ArrowRight"
```

) {

```
forestGame.keys[
  event.key
] = false;
```

}

}

// ==================================================
// 게임 루프
// ==================================================

function forestGameLoop() {

if (!forestGame.screen) {

```
return;
```

}

movePlayer();

updatePlayerPosition();

forestGame.animationId =
requestAnimationFrame(
forestGameLoop
);

}

// ==================================================
// 플레이어 이동
// ==================================================

function movePlayer() {

const speed = 0.45;

let moved = false;

// ------------------------------------------
// 위
// ------------------------------------------

if (
forestGame.keys["ArrowUp"]
) {

```
forestGame.playerY -= speed;

moved = true;
```

}

// ------------------------------------------
// 아래
// ------------------------------------------

if (
forestGame.keys["ArrowDown"]
) {

```
forestGame.playerY += speed;

moved = true;
```

}

// ------------------------------------------
// 왼쪽
// ------------------------------------------

if (
forestGame.keys["ArrowLeft"]
) {

```
forestGame.playerX -= speed;

moved = true;
```

}

// ------------------------------------------
// 오른쪽
// ------------------------------------------

if (
forestGame.keys["ArrowRight"]
) {

```
forestGame.playerX += speed;

moved = true;
```

}

if (!moved) {

```
return;
```

}

// ------------------------------------------
// 화면 밖으로 나가는지 확인
// ------------------------------------------

checkForestBoundary();

}

// ==================================================
// 플레이어 위치 적용
// ==================================================

function updatePlayerPosition() {

if (!forestGame.player) {

```
return;
```

}

forestGame.player.style.left =
forestGame.playerX + "%";

forestGame.player.style.top =
forestGame.playerY + "%";

}

// ==================================================
// 숲의 경계 확인
// ==================================================

function checkForestBoundary() {

const edge = 5;

// ------------------------------------------
// 위쪽
// ------------------------------------------

if (
forestGame.playerY <= edge
) {

```
forestGame.playerY =
  edge;


if (
  forestGame.currentRoom.exits.up
) {

  enterDeeperForest("up");

}
```

}

// ------------------------------------------
// 아래쪽
// ------------------------------------------

if (
forestGame.playerY >= 100 - edge
) {

```
forestGame.playerY =
  100 - edge;


if (
  forestGame.currentRoom.exits.down
) {

  moveBackOrExit();

}
```

}

// ------------------------------------------
// 왼쪽
// ------------------------------------------

if (
forestGame.playerX <= edge
) {

```
forestGame.playerX =
  edge;


if (
  forestGame.currentRoom.exits.left
) {

  enterDeeperForest("left");

}
```

}

// ------------------------------------------
// 오른쪽
// ------------------------------------------

if (
forestGame.playerX >= 100 - edge
) {

```
forestGame.playerX =
  100 - edge;


if (
  forestGame.currentRoom.exits.right
) {

  enterDeeperForest("right");

}
```

}

}

// ==================================================
// 깊은 숲으로 이동
// ==================================================

function enterDeeperForest(
direction
) {

// 키를 계속 누르고 있을 때
// 여러 번 이동하지 않도록 초기화

forestGame.keys = {};

// ------------------------------------------
// 새로운 깊은 숲 생성
// ------------------------------------------

forestGame.depth++;

forestGame.currentRoom =
createForestRoom(
direction
);

renderForestRoom();

}

// ==================================================
// 아래쪽 이동
// ==================================================

function moveBackOrExit() {

forestGame.keys = {};

// ------------------------------------------
// 가장 처음 숲
// ------------------------------------------

if (
forestGame.depth === 0
) {

```
exitForestGame();


return;
```

}

// ------------------------------------------
// 깊은 숲
// ------------------------------------------

forestGame.depth--;

const oldRoom =
forestGame.currentRoom;

const returnDirection =
oldRoom.parentDirection;

// ------------------------------------------
// 이전 숲으로 돌아가는 공간
// ------------------------------------------

forestGame.currentRoom = {

```
parentDirection: null,

exits: {

  left: false,

  right: false,

  up: false,

  down: false

}
```

};

// 들어왔던 반대 방향을
// 돌아가는 길로 설정

const opposite =
getOppositeDirection(
returnDirection
);

if (opposite) {

```
forestGame.currentRoom
  .exits[opposite] = true;
```

}

renderForestRoom();

}

// ==================================================
// 반대 방향
// ==================================================

function getOppositeDirection(
direction
) {

if (
direction === "left"
) {

```
return "right";
```

}

if (
direction === "right"
) {

```
return "left";
```

}

if (
direction === "up"
) {

```
return "down";
```

}

if (
direction === "down"
) {

```
return "up";
```

}

return null;

}

// ==================================================
// 숲에서 나가기
// ==================================================

function exitForestGame() {

console.log(
"숲에서 나갑니다."
);

stopForestKeyboard();

if (
forestGame.animationId
) {

```
cancelAnimationFrame(
  forestGame.animationId
);
```

}

if (
forestGame.screen
) {

```
forestGame.screen.remove();
```

}

forestGame.screen = null;

forestGame.player = null;

forestGame.currentRoom = null;

forestGame.depth = 0;

forestGame.keys = {};

}

// ==================================================
// 숲 게임 CSS
// ==================================================

function addForestGameStyle() {

if (
document.getElementById(
"forest-game-style"
)
) {

```
return;
```

}

const style =
document.createElement(
"style"
);

style.id =
"forest-game-style";

style.innerHTML = `

```
/* ==========================================
   전체 화면
   ========================================== */

#forest-game-screen {

  position: fixed;

  inset: 0;

  z-index: 9999;

  color: white;

  font-family: sans-serif;

}



/* ==========================================
   숲
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
   상단
   ========================================== */

.forest-header {

  position: absolute;

  top: 0;

  left: 0;

  width: 100%;

  box-sizing: border-box;

  padding: 16px 20px;

  display: flex;

  justify-content:
    space-between;

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
   나가기
   ========================================== */

.forest-exit-button {

  border: none;

  border-radius: 8px;

  padding: 8px 13px;

  background:
    rgba(255, 255, 255, 0.15);

  color: white;

  cursor: pointer;

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
   중앙 숲
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
   방향 입구
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

}



/* ==========================================
   위
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
   왼쪽
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
   오른쪽
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
   아래
   ========================================== */

.forest-down {

  left: 50%;

  bottom: 0;

  width: 110px;

  height: 55px;

  transform:
    translateX(-50%);

  border-radius:
    55px 55px 0 0;

}



/* ==========================================
   임시 캐릭터
   ========================================== */

.forest-player {

  position: absolute;

  left: 50%;

  top: 50%;

  width: 28px;

  height: 28px;

  transform:
    translate(-50%, -50%);

  border-radius: 50%;

  background: #81c784;

  border: 3px solid white;

  box-sizing: border-box;

  box-shadow:
    0 0 10px
    rgba(0, 0, 0, 0.5);

  z-index: 5;

  pointer-events: none;

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

  color:
    rgba(255, 255, 255, 0.7);

  font-size: 12px;

  text-align: center;

  pointer-events: none;

}
```

`;

document.head.appendChild(
style
);

}

