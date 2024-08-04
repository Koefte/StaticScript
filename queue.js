"use strict";
// !!!!! Alles ChatGPT !!!!!
Object.defineProperty(exports, "__esModule", { value: true });
exports.Queue = void 0;
var Queue = /** @class */ (function () {
    function Queue() {
        this.items = [];
    }
    Queue.prototype.enqueue = function (element) {
        this.items.push(element);
    };
    Queue.prototype.dequeue = function () {
        return this.items.shift();
    };
    Queue.prototype.peek = function () {
        return this.items[0];
    };
    Queue.prototype.isEmpty = function () {
        return this.items.length === 0;
    };
    Queue.prototype.size = function () {
        return this.items.length;
    };
    Queue.prototype.clear = function () {
        this.items = [];
    };
    Queue.prototype.print = function () {
        console.log(this.items.toString());
    };
    return Queue;
}());
exports.Queue = Queue;
