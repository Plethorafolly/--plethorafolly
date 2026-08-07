/* ==================================================
   몬스터 데이터
   ================================================== */

const MONSTER_COLLECTION_DATA = {

  racconn: {

    name: "티거",

    img: "./2112.png",

    motif: "너구리",

    description:
      "숲에서 발견되는 몬스터입니다.",
       
    realdescription:
      "보호소로 신고가 들어오는 포유류 중 가장 많은 수를 차지한다. 전염병이 많으므로 만지지 않도록 하자."

  },

  softshellturtle : {

    name: "현무",

    img: "./2113.png",

    motif: "자라",

    description:
      "얕은 물에서 발견되는 몬스터입니다.",

    realdescription:
      "바닥이 모래로 되어있는 민물을 좋아한다."

  }

};


/* ==================================================
   숲에서 사용하는 몬스터 목록
   ================================================== */

const MONSTER_LIST =
  Object.entries(
    MONSTER_COLLECTION_DATA
  ).map(
    ([species, monster]) => ({

      species,

      name: monster.name,

      img: monster.img,

      motif: monster.motif,

      description:
        monster.description

    })
  );


/*
 * forest.js에서 사용할 수 있도록
 * window에 연결
 */

window.MONSTER_LIST =
  MONSTER_LIST;


/* ==================================================
   저장 키
   ================================================== */

const COLLECTION_STORAGE_KEY =
  "forestMonsterCollection";


/* ==================================================
   도감 불러오기
   ================================================== */

function loadMonsterCollection() {

  let savedData = {};

  try {

    const saved =
      localStorage.getItem(
        COLLECTION_STORAGE_KEY
      );

    if (saved) {

      savedData =
        JSON.parse(saved);

    }

  } catch (error) {

    console.error(
      "도감 데이터를 불러오지 못했습니다.",
      error
    );
  }


  const collection = {};


  Object.keys(
    MONSTER_COLLECTION_DATA
  ).forEach(
    species => {

      collection[species] =
        savedData[species] === true;

    }
  );


  return collection;
}


window.monsterCollection =
  loadMonsterCollection();


/* ==================================================
   몬스터 해금
   ================================================== */

window.unlockMonster =
  function(species) {

    if (
      !MONSTER_COLLECTION_DATA[
        species
      ]
    ) {

      console.warn(
        "존재하지 않는 몬스터 species:",
        species
      );

      return;
    }


    window.monsterCollection[
      species
    ] = true;


    try {

      localStorage.setItem(

        COLLECTION_STORAGE_KEY,

        JSON.stringify(
          window.monsterCollection
        )

      );

    } catch (error) {

      console.error(
        "도감 데이터를 저장하지 못했습니다.",
        error
      );
    }


    console.log(
      "도감 해금:",
      species
    );
  };


/* ==================================================
   도감 열기
   ================================================== */

window.openCollection =
  function() {

    if (
      document.getElementById(
        "collection-screen"
      )
    ) {
      return;
    }


    const screen =
      document.createElement(
        "div"
      );

    screen.id =
      "collection-screen";


    screen.innerHTML = `

      <div class="collection-window">

        <div
          class="collection-header"
        >

          <h2>
            몬스터 도감
          </h2>

          <button
            type="button"
            class="collection-close"
            onclick="closeCollection()"
          >
            ×
          </button>

        </div>


        <div
          id="collection-list"
          class="collection-list"
        ></div>

      </div>

    `;


    document.body.appendChild(
      screen
    );


    addCollectionStyle();

    renderCollection();

  };


/* ==================================================
   도감 닫기
   ================================================== */

window.closeCollection =
  function() {

    const screen =
      document.getElementById(
        "collection-screen"
      );

    if (screen) {

      screen.remove();

    }

  };


/* ==================================================
   도감 렌더링
   ================================================== */

window.renderCollection =
  function() {

    const list =
      document.getElementById(
        "collection-list"
      );

    if (!list) {
      return;
    }


    list.innerHTML = "";


    Object.keys(
      MONSTER_COLLECTION_DATA
    ).forEach(
      species => {

        const monster =
          MONSTER_COLLECTION_DATA[
            species
          ];


        const unlocked =
          window.monsterCollection[
            species
          ] === true;


        const card =
          document.createElement(
            "div"
          );


        card.className =
          unlocked

            ? "collection-card unlocked"

            : "collection-card locked";


        if (unlocked) {

          card.innerHTML = `

            <img
              src="${monster.img}"
              alt="${escapeHtml(
                monster.name
              )}"
              class="collection-monster-image"
            >

            <div
              class="collection-monster-name"
            >
              ${escapeHtml(
                monster.name
              )}
            </div>

            <div
              class="collection-monster-species"
            >
              ${escapeHtml(
                species
              )}
            </div>

            <div
              class="collection-monster-description"
            >
              ${escapeHtml(
                monster.description
              )}
            </div>

            <div
              class="collection-click-guide"
            >
              클릭하여 자세히 보기
            </div>

          `;


          /*
           * 획득한 몬스터만 클릭 가능
           */

          card.addEventListener(
            "click",
            function() {

              showMonsterDetail(
                monster
              );

            }
          );

        } else {

          card.innerHTML = `

            <div
              class="collection-question"
            >
              ?
            </div>

            <div
              class="collection-monster-name"
            >
              ???
            </div>

            <div
              class="collection-monster-species"
            >
              미발견
            </div>

            <div
              class="collection-monster-realdescription"
            >
              아직 발견하지 못한 몬스터입니다.
            </div>

          `;

        }


        list.appendChild(
          card
        );

      }
    );

  };


/* ==================================================
   몬스터 상세 정보
   ================================================== */

function showMonsterDetail(
  monster
) {

  const screen =
    document.createElement(
      "div"
    );

  screen.className =
    "monster-detail-screen";


  screen.innerHTML = `

    <div
      class="monster-detail-window"
      onclick="event.stopPropagation()"
    >

      <button
        type="button"
        class="monster-detail-close"
      >
        ×
      </button>


      <img
        src="${monster.img}"
        alt="${escapeHtml(
          monster.name
        )}"
        class="monster-detail-image"
      >


      <h2>
        ${escapeHtml(
          monster.name
        )}
      </h2>


      <div
        class="monster-detail-motif"
      >
        모티브:
        ${escapeHtml(
          monster.motif
        )}
      </div>


      <p
        class="monster-detail-realdescription"
      >
        ${escapeHtml(
          monster.realdescription
        )}
      </p>

    </div>

  `;


  document.body.appendChild(
    screen
  );


  screen.addEventListener(
    "click",
    function() {

      screen.remove();

    }
  );


  screen
    .querySelector(
      ".monster-detail-close"
    )
    .addEventListener(
      "click",
      function() {

        screen.remove();

      }
    );

}


/* ==================================================
   도감 CSS
   ================================================== */

function addCollectionStyle() {

  if (
    document.getElementById(
      "collection-style"
    )
  ) {
    return;
  }


  const style =
    document.createElement(
      "style"
    );


  style.id =
    "collection-style";


  style.innerHTML = `

    #collection-screen {

      position: fixed;

      inset: 0;

      z-index: 20000;

      display: flex;

      justify-content: center;

      align-items: center;

      background:
        rgba(0, 0, 0, 0.75);

      font-family: sans-serif;

      color: white;

    }


    .collection-window {

      position: relative;

      width:
        min(900px, 90vw);

      max-height: 85vh;

      overflow: hidden;

      box-sizing: border-box;

      padding: 24px;

      border-radius: 16px;

      background:
        #202b1d;

      border:
        2px solid #81c784;

      box-shadow:
        0 0 30px
        rgba(0, 0, 0, 0.7);

    }


    .collection-header {

      display: flex;

      align-items: center;

      justify-content: space-between;

      margin-bottom: 20px;

    }


    .collection-header h2 {

      margin: 0;

      font-size: 24px;

    }


    .collection-close {

      width: 36px;

      height: 36px;

      border: none;

      border-radius: 50%;

      background:
        rgba(255, 255, 255, 0.12);

      color: white;

      font-size: 25px;

      line-height: 1;

      cursor: pointer;

    }


    .collection-close:hover {

      background:
        rgba(255, 255, 255, 0.25);

    }


    .collection-list {

      display: grid;

      grid-template-columns:
        repeat(
          auto-fill,
          minmax(180px, 1fr)
        );

      gap: 16px;

      max-height: 65vh;

      overflow-y: auto;

      padding: 4px;

    }


    .collection-card {

      min-height: 250px;

      padding: 16px;

      box-sizing: border-box;

      border-radius: 12px;

      text-align: center;

      background:
        rgba(255, 255, 255, 0.08);

      border:
        1px solid
        rgba(255, 255, 255, 0.12);

    }


    .collection-card.unlocked {

      background:
        rgba(
          129,
          199,
          132,
          0.12
        );

      border:
        1px solid
        rgba(
          129,
          199,
          132,
          0.5
        );

      cursor: pointer;

      transition:
        transform 0.2s,
        background 0.2s;

    }


    .collection-card.unlocked:hover {

      transform:
        translateY(-4px);

      background:
        rgba(
          129,
          199,
          132,
          0.2
        );

    }


    .collection-card.locked {

      opacity: 0.7;

    }


    .collection-monster-image {

      display: block;

      width: 140px;

      height: 140px;

      margin:
        0 auto 10px auto;

      object-fit: contain;

      border: none;

      background: transparent;

    }


    .collection-question {

      display: flex;

      justify-content: center;

      align-items: center;

      width: 140px;

      height: 140px;

      margin:
        0 auto 10px auto;

      font-size: 80px;

      font-weight: bold;

      color: #777;

      background:
        rgba(0, 0, 0, 0.2);

      border-radius: 12px;

    }


    .collection-monster-name {

      font-size: 18px;

      font-weight: bold;

      margin-bottom: 5px;

    }


    .collection-monster-species {

      font-size: 11px;

      color: #aeb8aa;

      margin-bottom: 10px;

    }


    .collection-monster-description {

      font-size: 13px;

      line-height: 1.5;

      color: #d7ddd5;

    }


    .collection-click-guide {

      margin-top: 10px;

      font-size: 11px;

      color: #a5d6a7;

    }


    /* 몬스터 상세 창 */

    .monster-detail-screen {

      position: fixed;

      inset: 0;

      z-index: 30000;

      display: flex;

      align-items: center;

      justify-content: center;

      background:
        rgba(0, 0, 0, 0.78);

      font-family: sans-serif;

    }


    .monster-detail-window {

      position: relative;

      width:
        min(420px, 85vw);

      padding: 28px;

      box-sizing: border-box;

      border-radius: 18px;

      background:
        #202b1d;

      border:
        2px solid #81c784;

      box-shadow:
        0 0 35px
        rgba(0, 0, 0, 0.7);

      text-align: center;

      color: white;

    }


    .monster-detail-close {

      position: absolute;

      top: 12px;

      right: 12px;

      width: 34px;

      height: 34px;

      border: none;

      border-radius: 50%;

      background:
        rgba(255, 255, 255, 0.12);

      color: white;

      font-size: 24px;

      line-height: 1;

      cursor: pointer;

    }


    .monster-detail-close:hover {

      background:
        rgba(255, 255, 255, 0.25);

    }


    .monster-detail-image {

      width: 220px;

      height: 220px;

      object-fit: contain;

      margin-bottom: 10px;

    }


    .monster-detail-window h2 {

      margin:
        5px 0 8px 0;

      font-size: 24px;

    }


    .monster-detail-motif {

      margin-bottom: 14px;

      font-size: 14px;

      color: #a5d6a7;

    }


    .monster-detail-description {

      margin: 0;

      line-height: 1.7;

      font-size: 14px;

      color: #d7ddd5;

    }

  `;


  document.head.appendChild(
    style
  );

}


console.log(
  "collection.js 로드 성공!"
);
