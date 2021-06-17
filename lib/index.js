"use strict";

const height = window.innerHeight;
const width = window.innerWidth;
const isPhone = height > width;
const offsetLeft = isPhone ? 2 : 200;
const offsetTop = 50;
const margin = isPhone ? 5 : 10;
const CARD_WIDTH = (width - offsetLeft * 2 - margin * 9) / 10;
const CARD_HEIGHT = CARD_WIDTH * 1.2;
const card_border = 4;
const card_dom_width = CARD_WIDTH - 2 * card_border;
const card_dom_height = CARD_HEIGHT - 2 * card_border;
const font_size = isPhone ? card_dom_width / 2 : 22;
const yadd_view = font_size + 5;
const yadd_back = 12;
const source_top = offsetTop + margin;
const work_top = offsetTop + CARD_HEIGHT + 2 * margin;
const card_intervel = CARD_WIDTH + margin;
const max_y = height - offsetTop - CARD_HEIGHT;
var maxZ = 0; // 向量

class Vec {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  plus(other) {
    return new Vec(this.x + other.x, this.y + other.y);
  }

  times(factor) {
    return new Vec(this.x * factor, this.y * factor);
  }

} // 纸牌对象


class Card {
  // 花色、点数、位置、正反面、dom元素
  constructor(color, point, position, isView) {
    this.color = color;
    this.point = point;
    this.position = position;
    this.isView = isView;
    let text = point == 12 ? "K" : point == 11 ? "Q" : point == 10 ? "J" : point == 0 ? "A" : point + 1;
    this._dom = elt("div", {
      class: "card color_".concat(color, " card_back")
    }, [text]);
    this._dom.style.width = card_dom_width + "px";
    this._dom.style.height = card_dom_height + "px";
    document.querySelector(".main").append(this._dom);
  }

  setEvent(eventName, callBack) {
    this._dom[eventName] = callBack;
  } // 翻开


  turn(view) {
    if (this.isView == view) return;
    this.isView = view;

    this._dom.classList.remove("card_face", "card_back");

    this._dom.classList.add(view ? "card_face" : "card_back");

    let fontSize = (view ? font_size : 0) + "px";
    this._dom.style["font-size"] = fontSize;
    this._dom.style["line-height"] = fontSize;
  } // 移动


  moveTo(pos) {
    let savePos = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
    let xtime = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0.1;
    let ytime = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0.1;

    if (savePos) {
      this.lastPosition = this.position;
      this.position = pos;
    }

    this._dom.style["z-index"] = window.maxZ++;
    this._dom.style.transition = "top ".concat(ytime, "s, left ").concat(xtime, "s");
    this._dom.style.top = pos.y + "px";
    this._dom.style.left = pos.x + "px";
  }

  movePlus(vec) {
    var _this$next;

    this.moveTo(this.position.plus(vec));
    (_this$next = this.next) === null || _this$next === void 0 ? void 0 : _this$next.movePlus(vec);
  }

  posPlus(vec) {
    var _this$next2;

    this.moveTo(this.position.plus(vec), false, 0, 0);
    (_this$next2 = this.next) === null || _this$next2 === void 0 ? void 0 : _this$next2.posPlus(vec);
  }

  moveBack() {
    var _this$next3;

    this.moveTo(this.lastPosition);
    (_this$next3 = this.next) === null || _this$next3 === void 0 ? void 0 : _this$next3.moveBack();
  }

  fit(card) {
    return this.point == card.point + 1 && this.color == card.color;
  }

  fitHalf(card) {
    return this.point == card.point + 1;
  }

  get isActive() {
    if (!this.isView) return false;
    if (!this.next) return true;
    return this.next.isActive && this.fit(this.next);
  }

  hightLight() {
    var _this$next4;

    let first = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
    let className = first ? "card_light" : "card_light_next";

    this._dom.classList.add(className);

    setTimeout(() => {
      this._dom.classList.remove(className);
    }, 500);
    (_this$next4 = this.next) === null || _this$next4 === void 0 ? void 0 : _this$next4.hightLight(false);
  }

  toString() {
    return this._dom.style["z-index"];
  }

}

class Container {
  constructor(type, position) {
    this.type = type;
    this.cards = [];
    this.width = CARD_WIDTH;
    this.position = position;
    this._dom = elt("div", {
      class: "container container_".concat(type)
    });
    this._dom.style.top = position.y + "px";
    this._dom.style.left = position.x + "px";
    this._dom.style.width = card_dom_width + "px";
    this._dom.style.height = card_dom_height + "px";
    document.body.append(this._dom);
  }

  get nextPosition() {
    let groupN = Math.floor((this.cards.length - 1) / 10);
    return this.type == "tomb" ? this.position : this.position.plus(new Vec(yadd_back * groupN, 0));
  }

  in(cards) {
    cards = !Array.isArray(cards) ? [cards] : cards;
    cards.forEach(card => {
      this.cards.push(card);
      card.moveTo(this.nextPosition);
      card.container = this;
    });
  }

  outN(n) {
    return this.cards.splice(this.cards.length - n, n);
  }

  out(card) {
    this.cards.pop();
  }

}

class WorkCol extends Container {
  constructor(type, position, width) {
    super(type, position, width);
  }

  get isEmpty() {
    return !this.lastCard;
  }

  get nextPosition() {
    var _this$lastCard, _this$lastCard$positi, _this$lastCard2;

    let yadd = (_this$lastCard = this.lastCard) !== null && _this$lastCard !== void 0 && _this$lastCard.isView ? yadd_view : yadd_back;
    return (_this$lastCard$positi = (_this$lastCard2 = this.lastCard) === null || _this$lastCard2 === void 0 ? void 0 : _this$lastCard2.position.plus(new Vec(0, yadd))) !== null && _this$lastCard$positi !== void 0 ? _this$lastCard$positi : this.position;
  }

  get isCompleted() {
    if (this.lastCard.point != 0) return false;
    let current = this.lastCard;

    while (current.pre && current.pre.isView && current.pre.fit(current)) {
      current = current.pre;
    }

    return current.point == 12;
  }

  in(card) {
    if (this.lastCard) this.lastCard.next = card;

    while (card) {
      card.pre = this.lastCard;
      card.container = this;
      card.moveTo(this.nextPosition);
      this.lastCard = card;
      card = card.next;
    }

    this.adjust();
  }

  out(card) {
    this.lastCard = card.pre;
    if (!this.lastCard) return;
    this.lastCard.turn(true);
    this.lastCard.next = null;
    this.adjust();
  }

  getCards() {
    let cards = [];
    let card = this.lastCard;

    while (card) {
      cards.unshift(card);
      card = card.pre;
    }

    return cards;
  }

  adjust() {
    var _this$lastCard3;

    if (!((_this$lastCard3 = this.lastCard) !== null && _this$lastCard3 !== void 0 && _this$lastCard3.isView)) return;
    let cards = this.getCards();
    let viewCards = cards.filter(card => card.isView);
    let lastBackCard = cards[cards.length - viewCards.length - 1];
    let {
      x: x0,
      y: y0
    } = lastBackCard ? lastBackCard.position.plus(new Vec(0, yadd_back)) : viewCards[0].position;
    let y = max_y - y0;
    let yadd = Math.min(Math.floor(y / (viewCards.length - 1)), yadd_view);
    viewCards.forEach((card, i) => {
      card.moveTo(new Vec(x0, y0 + yadd * i));
    });
  }

  isOver(position) {
    return Math.abs(position.x - this.position.x) < this.width;
  }

  hightLight() {
    if (this.lastCard) {
      this.lastCard.hightLight();
      return;
    }

    this._dom.classList.add("card_light");

    setTimeout(() => {
      this._dom.classList.remove("card_light");
    }, 500);
  }

}

class Game {
  constructor() {
    this.source = new Container("source", new Vec(offsetLeft, source_top));
    this.works = new Array(10).fill(0).map((_, i) => new WorkCol("work", new Vec(offsetLeft + card_intervel * i, work_top)));
    this.tombs = new Array(8).fill(0).map((_, i) => new Container("tomb", new Vec(offsetLeft + card_intervel * (i + 2), source_top)));
    this.history = [];
    this.audio = {
      click: elt("audio", {
        src: "src/sound/click.wav"
      }),
      deal: elt("audio", {
        src: "src/sound/deal.wav"
      })
    };
    this.colorN = 1;
    this.degree = 1;
    this.time = 0;
    this.init();
  }

  init() {
    let buttons = [{
      text: "重开",
      class: "button",
      fuc: () => {
        this.restart();
      }
    }, {
      text: "新游戏",
      class: "button",
      fuc: () => {
        this.nextLevel();
      }
    }, {
      text: "提示",
      class: "button button_tip",
      fuc: () => {
        this.tip();
      }
    }, {
      text: "撤销",
      class: "button button_revoke",
      fuc: () => {
        this.playAudio("click");
        this.revoke();
      }
    }].map(item => {
      let b = elt("button", {
        class: item.class
      }, [item.text]);
      b.onclick = item.fuc;
      return b;
    });
    let selects = [{
      class: "select",
      lebal: "花色种类",
      fc: e => {
        this.colorN = e.target.selectedIndex + 1;
      },
      options: [{
        value: 1,
        label: "单色"
      }, {
        value: 2,
        label: "双色"
      }, {
        value: 3,
        label: "三色"
      }, {
        value: 4,
        label: "四色"
      }]
    }, {
      class: "select",
      lebal: "选择难度",
      fc: e => {
        this.degree = e.target.selectedIndex + 1;
      },
      options: [{
        value: 1,
        label: "初级"
      }, {
        value: 2,
        label: "中级"
      }, {
        value: 3,
        label: "高级"
      }]
    }].map(item => {
      let s = elt("select", {
        class: item.class
      }, item.options.map(option => elt("option", {
        value: option.value
      }, [option.label])));
      s.onchange = item.fc;
      return s;
    });
    document.querySelector(".floor").append(...selects, ...buttons);
    let timer = elt("span", {
      class: "timer"
    });
    setInterval(() => {
      let time = Date.now() - this.time;
      let s = time / 1000;
      let m = s / 60;
      let h = m / 60;
      let text = [h.toFixed(), (m % 60).toFixed(), (s % 60).toFixed()].map(item => item >= 10 ? item : "0" + item).join(":");
      timer.textContent = text;
      this.timeText = text;
    }, 500);
    document.querySelector(".header").prepend(timer);

    document.ondblclick = event => {
      event.preventDefault();
    };
  }

  playAudio(type) {
    this.audio[type].play();
  }

  clear() {
    this.cards.forEach(card => {
      card._dom.remove();
    });
    this.source.cards = [];
    this.tombs.forEach(item => {
      item.cards = [];
    });
    this.works.forEach(item => {
      item.lastCard = null;
    });
    this.history = [];
  }

  start(plan) {
    this.plan = plan;
    this.cards = plan.map(item => {
      let card = new Card(...item, new Vec(0, 0), false);
      card.setEvent("onclick", () => {
        var _card$container;

        if (((_card$container = card.container) === null || _card$container === void 0 ? void 0 : _card$container.type) != "source") return;
        this.saveState();
        this.deal(10);
      });
      card.setEvent("onmousedown", e => {
        var _card$container2;

        if (((_card$container2 = card.container) === null || _card$container2 === void 0 ? void 0 : _card$container2.type) != "work") return;
        this.mousedown(card, e);
      });
      return card;
    });
    this.source.in(this.cards);
    this.deal(54);
    this.time = Date.now();
  }

  deal(n) {
    this.playAudio("deal");
    this.source.outN(n).forEach((card, i) => {
      setTimeout(() => {
        if (i > n - 11) card.turn(true);
        let container = this.works[i % 10];
        container.in(card);

        if (container.isCompleted) {
          this.complete(container);
        }
      }, 0);
    });
  }

  mousedown(card, downEvent) {
    if (!card.isActive) return;
    card.movePlus(new Vec(0, -4));
    let [xadd, yadd] = [];

    document.onmousemove = event => {
      [xadd, yadd] = [event.clientX - downEvent.clientX, event.clientY - downEvent.clientY];
      card.posPlus(new Vec(xadd, yadd), 0, 0);
    };

    document.onmouseup = event => {
      this.playAudio("click");
      document.onmousemove = null;
      document.onmouseup = null;
      let time = event.timeStamp - downEvent.timeStamp;
      let container;

      if (time < 300) {
        // 单击
        container = this.getMoveableCol(card);
      } else {
        // 拖拽
        let pos = card.position.plus(new Vec(xadd, yadd));
        container = this.getMoveableCol(card, pos);
      }

      container ? this.move(card, container) : card.moveBack();
    };
  }

  getMoveableCol(card, position) {
    var _ref, _fithalfCol;

    let col = this.works.indexOf(card.container);
    let fithalfCol, emptyCol;

    for (let i = (col + 1) % 10; i != col; i = (i + 1) % 10) {
      let container = this.works[i];
      let lastCard = container.lastCard;
      if (position && !container.isOver(position)) continue;

      if (container.isEmpty) {
        var _emptyCol;

        emptyCol = (_emptyCol = emptyCol) !== null && _emptyCol !== void 0 ? _emptyCol : container;
        continue;
      }

      if (lastCard.fit(card)) return container;

      if (!fithalfCol && lastCard.fitHalf(card)) {
        fithalfCol = container;
      }
    }

    return (_ref = (_fithalfCol = fithalfCol) !== null && _fithalfCol !== void 0 ? _fithalfCol : emptyCol) !== null && _ref !== void 0 ? _ref : null;
  }

  move(card, container) {
    this.saveState();
    card.container.out(card);
    container.in(card);

    if (container.isCompleted) {
      this.complete(container);
    }
  }

  complete(container) {
    setTimeout(() => {
      this.playAudio("deal");
      let tomb = this.tombs.find(item => item.cards.length == 0);

      for (let i = 0; i < 13; i++) {
        setTimeout(() => {
          let lastCard = container.lastCard;
          container.out(lastCard);
          tomb.in(lastCard);
        }, 10 * i);
      }

      if (this.tombs[this.tombs.length - 1] == tomb) {
        setTimeout(() => {
          let [score, rank] = this.saveScore();
          alert("\u606D\u559C\u901A\u5173\uFF01\u7528\u65F6\uFF1A".concat(score.useTime, "\u3002\u64CD\u4F5C\uFF1A").concat(score.step, "\u6B65\u3002\u540C\u7B49\u7EA7\u6E38\u620F\u6392\u540D\uFF1A").concat(rank));
          this.nextLevel();
        }, 500);
      }
    }, 500);
  }

  saveScore() {
    var _JSON$parse, _gameScore$key;

    let gameScore = (_JSON$parse = JSON.parse(localStorage.getItem("gameScore"))) !== null && _JSON$parse !== void 0 ? _JSON$parse : {};
    let key = [this.colorN, this.degree].join("-");
    let scores = (_gameScore$key = gameScore[key]) !== null && _gameScore$key !== void 0 ? _gameScore$key : [];
    let score = {
      type: key,
      time: Date.now(),
      useMs: Date.now() - this.time,
      useTime: this.timeText,
      step: this.history.length
    };
    scores.push(score);
    gameScore[key] = scores;
    localStorage.setItem("gameScore", JSON.stringify(gameScore));
    let rank = scores.sort((a, b) => a.useMs - b.useMs).indexOf(score) + 1;
    console.log(gameScore);
    return [score, rank];
  }

  saveState() {
    let state = this.cards.sort().map(card => {
      return {
        card,
        view: card.isView,
        container: card.container
      };
    });
    this.history.push(state);
  }

  tip() {
    let tipTag = JSON.stringify(this.history.length);

    if (this.tipTag !== tipTag) {
      this.tips = this.getTips();
      this.tipN = 0;
      this.tipTag = tipTag;
    }

    if (this.tips.length) {
      let [card, col] = this.tips[this.tipN++ % this.tips.length];
      card.hightLight();
      col.hightLight();
    } else if (this.source.cards.length) {
      this.source.cards[this.source.cards.length - 1].hightLight();
    }
  }

  getTips() {
    let tips = [];
    let upTips = [];

    for (let work of this.works) {
      let card = work.lastCard;

      while ((_card = card) !== null && _card !== void 0 && _card.isActive) {
        var _card, _card$pre;

        let col = this.getMoveableCol(card);

        if (col) {
          tips.push([card, col]);
        }

        if (col && !((_card$pre = card.pre) !== null && _card$pre !== void 0 && _card$pre.isActive)) {
          upTips.push([card, col]);
        }

        card = card.pre;
      }
    }

    return upTips.length ? upTips : tips;
  }

  revoke() {
    var _this$history$pop;

    (_this$history$pop = this.history.pop()) === null || _this$history$pop === void 0 ? void 0 : _this$history$pop.forEach(_ref2 => {
      let {
        card,
        view,
        container
      } = _ref2;
      card.turn(view);

      if (card.container != container) {
        card.container.out(card);
        container.in(card);
      }
    });
  }

  restart() {
    this.clear();
    this.start(this.plan);
  }

  nextLevel() {
    this.clear();
    this.start(getPlan(this.colorN, this.degree));
  }

}

function runGame() {
  let colors = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
  let degree = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
  let game = new Game();
  game.start(getPlan(colors, degree));
}

function getPlan() {
  let colors = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
  let degree = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
  if (colors > 4 || colors < 1) colors = 1;
  let levelData = [];
  let colorType = 0;

  for (let i = 0; i < 104; i++) {
    if (i % 13 == 0) colorType++;
    levelData.push([colorType % colors, i % 13]);
  }

  levelData = shuffle(levelData, degree);
  return levelData;
}

function shuffle(levelData, degree) {
  let n = Math.pow(10, degree);

  for (let i = 0; i < n; i++) {
    let a = Math.floor(Math.random() * 1000) % levelData.length;
    let b = Math.floor(Math.random() * 1000) % levelData.length;
    let t = levelData[a];
    levelData[a] = levelData[b];
    levelData[b] = t;
  }

  return levelData;
}

function elt(name, attribute, children) {
  let el = document.createElement(name);
  Object.keys(attribute).forEach(key => {
    el.setAttribute(key, attribute[key]);
  });
  children === null || children === void 0 ? void 0 : children.forEach(child => {
    el.append(child);
  });
  return el;
}

runGame();