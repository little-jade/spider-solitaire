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
    toView() {
        this.isView = true;
        this.updateDom();
    }
    turn(view) {
        this.isView = value;
        this.cardDom.classList.add(view ? "card_face" : "card_back");
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
    moveDom(newPosition) {
        this.cardDom.style["z-index"] = window.maxZ++;
        this.cardDom.classList.add("card_notransition");
        this.cardDom.style.top = newPosition.y + "px";
        this.cardDom.style.left = newPosition.x + "px";
    }
    // 
    back() {
        this.moveTo(this.lastPosition);
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
    // 回收
    // 发放


    // 生成一副牌
    static createCards(cardData) {
        return cardData.map(item => new Card(...item, new Vec(100, -100), false));
    }
}

// 游戏对象
class Level{
    // 回收池、发放池、工作池、历史状态
    constructor(cardModel) {
        let cards = Card.createCards(cardModel);
        this.initCards = cards.splice(0, 54);
        this.sourceCards = new Array(5).fill(0).map((item, index) => {
            return {
                position: new Vec(50 + index * 20, 60),
                cards: cards.splice(0, 10)
            }
        });
        this.workCards = new Array(10).fill(0).map((item, index) => {
            return {
                position: new Vec(50 + index * 100, 160),
                cards: [],
                get lastCard() {
                    return this.cards[this.cards.length - 1];

                }
            }
        });
        this.completedCards = new Array(8).fill(0).map((item, index) => {
            return {
                position: new Vec(250 + index * 80, 60),
                cards: [],
            }
        });
        this.historyStates = [];
        window.maxZ = 0;
    }
    // 初始发牌
    start() {
        this.sourceCards.forEach(source => {
            source.cards.forEach(card => {
                card.moveTo(source.position);
                card.cardDom.onclick = this.workDeal.bind(this);
            })
        })

        this.initCards.forEach((card, index) => {
            if(index > 43) { card.toView() }
        });
        this.deal(this.initCards);
    }
    // 游戏中发牌
    workDeal() {
        if(!this.sourceCards.length) return;
        this.deal( this.sourceCards.pop().cards.map(card => {
            card.isView = true;
            
            return card;
        }) );
    }
    deal(cards) {
        cards.forEach((card, index) => {
            let col = index % 10;
            let workCards = this.workCards[col];
            let row = workCards.cards.length;
            let lastCard = workCards.cards[row -1];
            let lastPosition = lastCard?.position ?? workCards.position;            
            let yadd = lastCard?.isView ? 20 : 15;

            card.position = lastPosition.plus(new Vec(0, yadd));            
            card.workIndex = [col, row];
            card.cardDom.onclick = null;
            card.cardDom.onmousedown  = (event) => { this.mouseDownCard(card, event);};
            workCards.cards.push(card);

            setTimeout(() => {
                card.moveTo(card.position);
            }, 50 * index);
        });
    }

    // 拖拽或单击
    mouseDownCard(card, downEvent) {
        let activeCards = this.getActiveCards(card);
        if(activeCards.length == 0) return;        

        let [xadd, yadd] = [];
        document.onmousemove = (event) => {
            [xadd, yadd] = [event.clientX - downEvent.clientX, event.clientY - downEvent.clientY]

            activeCards.forEach(item => {
                item.moveDom(item.position.plus( new Vec(xadd, yadd) ) );
            });
        }

        document.onmouseup = (event) => {
            document.onmousemove = null;
            document.onmouseup = null;

            let time = event.timeStamp -downEvent.timeStamp;
            if(time < 300) { // 单击
                this.clickCards(activeCards);
            }
            else { // 拖拽
                let pos = activeCards[0].position.plus(new Vec(xadd, yadd));
                this.dropCards(activeCards, this.getCoverCols(pos));
            }
        }
    }
    getCoverCols(position){
        let res = [];
        for(let i = 0; i < 10; i++){
            let colPos = this.workCards[i].position;
            if(Math.abs(position.x - colPos.x) < 60){
                res.push(i);
            }
        }
        return res;
    }
    // 拖拽
    dropCards(cards, cols) {
        if(cols.length == 0) {this.back(cards); return;}
        for(let col of cols){
            let targetCard = this.workCards[col].cards[this.workCards[col].cards.length - 1];
            if(!targetCard || cards[0].point + 1 == targetCard.point) {
                this.move(cards, col);
                return;
            }
        }
        this.back(cards);        
    }
    // 单击
    clickCards(activeCards) {
        let activeCard = activeCards[0];
        let currentCol = activeCard.workIndex[0];
        let res0, res1;
        for(let i = 1; i < 10; i++){
            let col = (i + currentCol) % 10;
            let lastCard = this.workCards[col].lastCard;
            if(!lastCard) {
                res0 = res0 ?? col;
                continue;
            }
            if(lastCard.color == activeCard.color && lastCard.point == activeCard.point + 1) {
                this.move(activeCards, col);
                return;
            }
            if(lastCard.point == activeCard.point + 1) {
                res1 = res1 ?? col;
            }
        }
        let res = res1 ?? res0 ?? "no";
        if(res == "no"){
            this.back(activeCards);
        }
        else{
            this.move(activeCards, res);
        }
    }
    getActiveCards(card) {
        if(!card.isView) return [];
        let [col, row] = card.workIndex;
        let colCards = this.workCards[col].cards;
        for(let i =  row + 1; i < colCards.length; i++){
            if( colCards[i].color == colCards[i - 1].color  && 
                colCards[i].point == colCards[i - 1].point - 1 ) continue;
            return [];
        }
        let activeCards = colCards.slice(row);
        activeCards.forEach(card => {
            card.moveTo(card.position.plus(new Vec(0, -4)));
        })
        return activeCards;
    }
    checkCardActive(card) {
        if(!card.isView) return false;
        let [col, row] = card.workIndex;
        let colCards = this.workCards[col].cards;
        for(let i =  row + 1; i < colCards.length; i++){
            if( colCards[i].color == colCards[i - 1].color  && 
                colCards[i].point == colCards[i - 1].point - 1 ) continue;
            return false;
        }
        return true;
    }
    // 移动
    move(cards, col) {
        let [oldCol, oldRow] = cards[0].workIndex;
        let oldCards = this.workCards[oldCol].cards;
        oldCards.splice(oldRow, cards.length);
        oldCards[oldCards.length - 1]?.toView();


        let workCards = this.workCards[col];
        let row = workCards.cards.length;
        let lastCard = workCards.cards[row -1];
        let lastPosition = lastCard?.position ?? workCards.position;            
        let yadd = lastCard?.isView ? 20 : 15;

        cards.forEach(card => {
            card.position = lastPosition.plus(new Vec(0, yadd));            
            card.workIndex = [col, row];
            workCards.cards.push(card);
            
            card.moveTo(card.position);

            lastPosition = card.position;
            row++;
        });
        if(this.checkComplete(col)){
            this.completeCards(col);            
        }
    }
    back(cards){
        cards.forEach(cards => {
            cards.back();
        })
    }
    // 撤销
    revoke() {
        //  完成、发牌、移动
        let {type, cards, from, to, sourceCol, completedCol} = this.history.pop();
        switch (type){
            case "move":
                this.move(cards, col);
                break;
            case "deal" :
                this.back(cards)
                break;
            case "completed" :
                this.back(cards)
                break;
        }
        


    }
    // 检测游戏成功或失败
    check() {
    }
    checkComplete(col){
        let cards = this.workCards[col].cards;
        if(cards.length < 13 || cards[cards.length - 1].point > 0) return false;
        for(let i = cards.length - 1; i >= 0; i--){
            if(cards[i-1].color != cards[i].color || cards[i-1].point != cards[i].point + 1) return false;
            if(cards[i-1].point == 12) return true;
        }
        return false;
    }
    // 完成一列
    completeCards(col) {
        let cards = this.workCards[col].cards;
        let completeCol = this.completedCards.shift();
        for(let i = 0; i < 13; i++){
            let card = cards.pop();
            setTimeout(() => {
                card.moveTo(completeCol.position);
                card.cardDom.onmousedown = null;
                if(i == 12) {cards[cards.length - 1]?.toView()};
            }, 500 + i * 50);
        }        
    }
}

class Container{
    constructor(type, position) {
        this.type = type;
        this.cards = [];
        this.width = CARD_WIDTH;
        this.position = position;

        this._dom = elt("div", {class: `container_${type}`});
        this._dom.style.top = position.y + "px";
        this._dom.style.left = position.x + "px";
        document.body.appendChild(this._dom)
    }
    in(cards) {
        cards = !Array.isArray(cards) ? [cards] : cards;
        cards.forEach(card => {
            this.cards.push(card);
            card.moveTo(this.position);
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
        return this.lastCard?.position.plus(new Vec(0, 20)) ?? this.position;
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
    }
    out(card) {
        this.lastCard = card.pre;
        if(!this.lastCard) return;
        this.lastCard.toView();
        this.lastCard.next = null;
    }
    
    isOver(position) {
        return Math.abs(position.x - this.position.x) < this.width;
    }

}
class Game{
    constructor() {
        this.source = new Container("source", new Vec(0, 100));
        this.works = new Array(10).fill(0).map( (_, i) => new WorkCol("work", new Vec(100 * i, 200) ));
        this.tombs = new Array(8).fill(0).map( (_, i) => new Container("tomb", new Vec(100 * i, 100) ));
        this.history = [];
    }
    init() {
        let header = elt("div",{}, [time, title, core]);
        let main = elt("div", {}, []);
        let floor = elt("div", {}, [tipBut, backBut]);
        document.body.appendChild(header);
        document.body.appendChild(main);
        document.body.appendChild(floor);
    }
    start(plan) {
        this.cards = plan.map(item => {
            let card = new Card(...item, new Vec(100, -100), false);
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
        this.source.outN(n).forEach( (card, i) => {
            if(i > n - 11) card.toView();
            this.works[i % 10].in(card);
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
            let tomb = this.tombs.find(item => item.cards.length == 0);
            for(let i = 0; i < 13; i++){
                let lastCard = container.lastCard;
                container.out(lastCard);
                tomb.in(lastCard);
            }
        }
    }
    saveState() {
        let state = this.cards.map(card => {
            return {card, view: card.isView, container: card.container}
        });
        this.history.push(state);
    }
    revoke() {
        this.history.pop().forEach(({card, view, container}) => {
            card.turn(view)
            if(card.container != container){
                card.container.out(card);
                container.in(card);
            }
        });
    }
    restart() {
        this.start(this.cards)
    }
    nextLevel() {}
}

function runGame(colors = 1, degree = 1) {
    if(colors > 4 || colors < 1) colors = 1;
    let levelData = [];
    let colorType = 0;
    for(i = 0 ; i < 104; i++){
        if(i % 13 == 0) colorType++;
        levelData.push( [colorType % colors, i % 13] );
    }
    levelData = shuffle(levelData, degree);
    
    // let level = new Level(levelData);
    // level.start();
    //
    let game = new Game();
    game.start(levelData);
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
        el.appendChild(child);
    })
    return el;
}
runGame(2, 10);

