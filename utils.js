'use strict';

function Utils() {
  this.twoDigits = val => `0${val}`.slice(-2);
  this.getHumanTimeFormat = date => {
    date = new Date(date);
    const d = this.twoDigits(date.getDate());
    const M = this.twoDigits(date.getMonth()+1);
    const y = this.twoDigits(date.getFullYear());
    const h = this.twoDigits(date.getHours());
    const m = this.twoDigits(date.getMinutes());

    return `${d}.${M}.${y} ${h}:${m}`;
  };
}

module.exports = new Utils();
