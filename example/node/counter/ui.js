/* eslint-env browser */
/* global rempl */

const subscriber = rempl.getSubscriber();

subscriber.subscribe((counter) => {
    document.getElementById('counter').innerHTML = counter;
});

document.body.appendChild(document.createElement('div')).innerHTML = `
    <b id="counter"></b>
    <br>
    <button onclick="reset()">reset</button>
`;

document.querySelector('button').onclick = () => {
    subscriber.callRemote('reset');
};
