const MONSTER_COLLECTION_DATA = {

  racconn: {
    name: "티거",
    img: "./2112.png",
    description: "숲에서 발견되는 몬스터입니다."
  },

  wolf: {
    name: "늑대",
    img: "./wolf.png",
    description: "깊은 숲에서 발견되는 몬스터입니다."
  },

  fox: {
    name: "여우",
    img: "./fox.png",
    description: "숲속을 빠르게 돌아다니는 몬스터입니다."
  }

};


const COLLECTION_STORAGE_KEY =
  "forestMonsterCollection";


function loadMonsterCollection() {

  let savedData = {};

  try {

    const saved =
      localStorage.getItem(
        COLLECTION_STORAGE_KEY
      );

    if (saved) {
      savedData = JSON.parse(saved);
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
  ).forEach(species => {

    collection[species] =
      savedData[species] === true;

  });


  return collection;
}


window.monsterCollection =
  loadMonsterCollection();


window.unlockMonster =
  function(species) {

    if (
      !MONSTER_COLLECTION_DATA[species]
    ) {

      console.warn(
        "존재하지 않는 몬스터 species:",
        species
      );

      return;
    }


    window.monsterCollection[species] =
      true;


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
      document.createElement("div");

    screen.id =
      "collection-screen";


    screen.innerHTML = `

      <div class="collection-window">

        <div class="collection-header">

          <h2>몬스터 도감</h2>

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


    document.body.appendChild(screen);


    addCollectionStyle();

    renderCollection();
  };


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
    ).forEach(species => {

      const monster =
        MONSTER_COLLECTION_DATA[species];


      const unlocked =
        window.monsterCollection[species] === true;


      const card =
        document.createElement("div");


      card.className =
        unlocked
          ? "collection-card unlocked"
          : "collection-card locked";


      if (unlocked) {

        card.innerHTML = `

          <img
            src="${monster.img}"
            alt="${monster.name}"
            class="collection-monster-image"
          >

          <div class="collection-monster-name">
            ${monster.name}
          </div>

          <div class="collection-monster-species">
            ${species}
          </div>

          <div class="collection-monster-description">
            ${monster.description}
          </div>

        `;

      } else {

        card.innerHTML = `

          <div class="collection-question">
            ?
          </div>

          <div class="collection-monster-name">
            ???
          </div>

          <div class="collection-monster-species">
            미발견
          </div>

          <div class="collection-monster-description">
            아직 발견하지 못한 몬스터입니다.
          </div>

        `;
      }


      list.appendChild(card);

    });

  };


function addCollectionStyle() {

  if (
    document.getElementById(
      "collection-style"
    )
  ) {
    return;
  }


  const style =
    document.createElement("style");


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

      width: min(900px, 90vw);

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
        rgba(129, 199, 132, 0.12);

      border:
        1px solid
        rgba(129, 199, 132, 0.5);

    }


    .collection-card.locked {

      opacity: 0.7;

    }


    .collection-monster-image {

      display: block;

      width: 140px;

      height: 140px;

      margin: 0 auto 10px auto;

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

      margin: 0 auto 10px auto;

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

  `;


  document.head.appendChild(style);
}


console.log(
  "collection.js 로드 성공"
);
