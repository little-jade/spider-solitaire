const CARD_WIDTH = 60;
const CARD_HEIGHT = 90;
const CARD_INTERVEL = 10;
const CARD_FONT_SIZE = 20;
var maxZ = 0;
// 向量
class Vec {
    constructor(x, y) {
      this.x = x; this.y = y;
    }
    plus(other) {
      return new Vec(this.x + other.x, this.y + other.y);
    }
    times(factor) {
      return new Vec(this.x * factor, this.y * factor);
    }
  }
// 纸牌对象
class Card {
    // 花色、点数、位置、正反面、dom元素
    constructor(color, point, position, isView){
        this.color = color;
        this.point = point;
        this.position = position;
        this.isView = isView;

        let classes = [
            "card", 
            `card_${isView ? "face" : "back"}`, 
            `color_${color}`
        ].join(" ");
        let elcard = elt(
            "div", 
            {class: classes}, 
            [document.createTextNode(point)]
        );
        elcard.style.top = `${position.y}px`;
        elcard.style.left = `${position.x}px`;
        document.body.appendChild(elcard);
        this.cardDom = elcard;
    }
    setEvent(eventName, callBack) {
        this.cardDom[eventName] = callBack;

    }
    updateDom() {
        this.cardDom.setAttribute("class", `card card_${this.isView ? "face": "back"} color_${this.color}`);
        this.cardDom.style["z-index"] = window.maxZ++;
        this.cardDom.style.top = this.position.y + "px";
        this.cardDom.style.left = this.position.x + "px";
    }
    // 翻开
    turn(view) {
        if(this.isView == view) return;
        this.isView = view;
        this.updateDom();
    }
    // 移动
    moveTo(newPosition) {
        this.lastPosition = this.position;
        this.position = newPosition;
        this.updateDom();
    }
    movePlus(vec) {
        this.lastPosition = this.position;
        this.position = this.position.plus(vec);
        this.updateDom();
        this.next?.movePlus(vec);
    }
    posPlus(vec) {
        let pos = this.position.plus(vec);
        this.cardDom.style["z-index"] = window.maxZ++;
        this.cardDom.classList.add("card_notransition");
        this.cardDom.style.top = pos.y + "px";
        this.cardDom.style.left = pos.x + "px";
        this.next?.posPlus(vec);
    }
    moveBack() {
        this.moveTo(this.lastPosition);
        this.next?.moveBack();
    }
    fit(card){
        return this.point == card.point + 1 && this.color == card.color;
    }
    fitHalf(card){
        return this.point == card.point + 1;
    }
    get isActive() {
        if(!this.next) return true;
        return this.next.isActive && this.fit(this.next);
    }
    toString() {
        return this.cardDom.style["z-index"];
    }
    // 回收
    // 发放


    // 生成一副牌
    static createCards(cardData) {
        return cardData.map(item => new Card(...item, new Vec(100, -100), false));
    }
}

class Container{
    constructor(type, position) {
        this.type = type;
        this.cards = [];
        this.width = CARD_WIDTH;
        this.position = position;

        this._dom = elt("div", {class: `container container_${type}`});
        this._dom.style.top = position.y + "px";
        this._dom.style.left = position.x + "px";
        document.body.appendChild(this._dom)
    }
    get nextPosition() {
        let groupN = Math.floor((this.cards.length - 1) / 10);
        return this.type == "tomb" ? 
        this.position : 
        this.position.plus( new Vec(20 * groupN, 0) );
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
class WorkCol extends Container{
    constructor(type, position, width) {
        super(type, position, width);
    }
    get isEmpty() {
        return !this.lastCard;
    }
    get nextPosition() {
        let yadd = this.lastCard?.isView ? 24 : 12;
        return this.lastCard?.position.plus(new Vec(0, yadd)) ?? this.position;
    }
    get isCompleted() {
        if(this.lastCard.point != 0) return false;
        let current = this.lastCard;
        while(current.pre && current.pre.isView && current.pre.fit(current)){
            current = current.pre;
        }
        return current.point == 12;
    }
    in(card) {
        if(this.lastCard) this.lastCard.next = card;
        while(card){
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
        if(!this.lastCard) return;
        this.lastCard.turn(true);
        this.lastCard.next = null;
    }
    getCards() {
        let cards = [];
        let card = this.lastCard;
        while(card){
            cards.unshift(card);
            card = card.pre;
        }
        return cards;
    }
    adjust() {
        if(!this.lastCard || this.lastCard.position.y < 600) return;
        let cards = this.getCards().filter(card => card.isView);
        let {x: x0, y: y0} = cards[0].position;
        let y = this.lastCard.position.y - y0;
        let yadd = Math.floor(y/cards.length);        
        cards.forEach((card, i) => {
            card.moveTo(new Vec(x0, y0 + yadd * i));
        });
    }
    isOver(position) {
        return Math.abs(position.x - this.position.x) < this.width;
    }

}
class Game{
    constructor() {
        this.source = new Container("source", new Vec(20, 60));
        this.works = new Array(10).fill(0).map( (_, i) => new WorkCol("work", new Vec(20 + 100 * i, 180) ));
        this.tombs = new Array(8).fill(0).map( (_, i) => new Container("tomb", new Vec(220 + 100 * i, 60) ));
        this.history = [];
        this.init();
    }
    init() {
        let buttons = [
            {text: "撤销", fuc: () => {this.playAudio("click");this.revoke();}},
            {text: "重开", fuc: () => {this.restart();}},
            {text: "新游戏", fuc: () => {this.clear(); this.start(getPlan(2, 100))}}
        ].map( item => {
            let b = elt("button", {class:"button"}, [item.text]);
            b.onclick = item.fuc;
            return b;
        });

        document.querySelector(".floor").append(...buttons);
    }
    playAudio(type) {
        let audio = document.createElement("audio");
        audio.src = `sound/${type}.wav`;
        audio.play();
    }
    clear() {
        this.cards.forEach(card => {
            card.cardDom.remove();
        });
        this.source.cards = [];
        this.tombs.forEach(item => {item.cards = []});
        this.works.forEach(item => {item.lastCard = null});
        this.history = [];
    }
    start(plan) {
        this.plan = plan;
        this.cards = plan.map(item => {
            let card = new Card(...item, new Vec(0, 0), false);
            card.setEvent("onclick",  () => {
                if(card.container?.type != "source") return;
                this.saveState();
                this.deal(10);
            });
            card.setEvent("onmousedown",  (e) => {
                if(card.container?.type != "work") return;
                this.mousedown(card, e);
            });
            return card;
        });
        this.source.in(this.cards);
        this.deal(54); 
    }
    deal(n) {
        this.playAudio(n > 10 ? "deal1" : "deal1");
        this.source.outN(n).forEach( (card, i) => {
            setTimeout(() => {
                if(i > n - 11) card.turn(true);
                this.works[i % 10].in(card);
            }, 0);
        });
    }
    mousedown(card, downEvent) {
        if(!card.isActive) return;
        card.movePlus(new Vec(0, -4));

        let [xadd, yadd] = [];
        document.onmousemove = (event) => {
            [xadd, yadd] = [event.clientX - downEvent.clientX, event.clientY - downEvent.clientY]

            card.posPlus(new Vec(xadd, yadd), 0, 0);
        }

        document.onmouseup = (event) => {
            this.playAudio("click");
            document.onmousemove = null;
            document.onmouseup = null;

            let time = event.timeStamp -downEvent.timeStamp;
            let container;
            if(time < 300) { // 单击
                container = this.getMoveableCol(card);
            }
            else { // 拖拽
                let pos = card.position.plus(new Vec(xadd, yadd));
                container = this.getMoveableCol(card, pos);
            }
            container ? this.move(card, container) : card.moveBack();
        }

    }
    getMoveableCol(card, position) {
        let col = this.works.indexOf(card.container);
        let fithalfCol, emptyCol;
        for(let i = (col + 1) % 10; i != col; i = (i + 1) % 10) {
            let container = this.works[i];
            let lastCard = container.lastCard;
            if(position && !container.isOver(position)) continue;
            if(container.isEmpty) {emptyCol = emptyCol ?? container; continue;}
            if(lastCard.fit(card)) return container;
            if(!fithalfCol && lastCard.fitHalf(card)) {fithalfCol = container;}
        }
        return fithalfCol ?? emptyCol ?? null;
    }
    move(card, container) {
        this.saveState();
        card.container.out(card);
        container.in(card);
        if(container.isCompleted){
            setTimeout(() => {
                this.playAudio("deal1");
                let tomb = this.tombs.find(item => item.cards.length == 0);
                for(let i = 0; i < 13; i++){
                    setTimeout(() => {
                        let lastCard = container.lastCard;
                        container.out(lastCard);
                        tomb.in(lastCard);
                    }, 10 * i);
                }
            }, 500);
        }
    }
    saveState() {
        let state = this.cards.sort().map(card => {
            return {card, view: card.isView, container: card.container}
        });
        this.history.push(state);
    }
    revoke() {
        this.history.pop()?.forEach(({card, view, container}) => {
            card.turn(view);
            if(card.container != container){
                card.container.out(card);
                container.in(card);
            }
        });
    }
    restart() {
        this.clear();
        this.start(this.plan)
    }
}

function runGame(colors = 1, degree = 1) {
    let game = new Game();
    game.start(getPlan(colors, degree));
}
function getPlan(colors = 1, degree = 1) {
    if(colors > 4 || colors < 1) colors = 1;
    let levelData = [];
    let colorType = 0;
    for(i = 0 ; i < 104; i++){
        if(i % 13 == 0) colorType++;
        levelData.push( [colorType % colors, i % 13] );
    }
    levelData = shuffle(levelData, degree);
    return levelData;
}
function shuffle(levelData, degree) {
    for(i = 0; i < degree * 10; i ++){
        let a = Math.floor(Math.random() * 1000) % levelData.length;
        let b = Math.floor(Math.random() * 1000) % levelData.length;

        let t = levelData[a];
        levelData[a] = levelData[b];
        levelData[b] = t;
    };
    return levelData;
}
function elt(name, attribute, children) {
    let el = document.createElement(name);
    Object.keys(attribute).forEach(key => {
        el.setAttribute(key, attribute[key]);
    })
    children?.forEach(child => {
        el.append(child);
    })
    return el;
}
runGame(2, 100);

