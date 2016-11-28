function complete(dest, source){
    for (var key in source) {
        if (key in dest == false) {
            dest[key] = source[key];
        }
    }

    return dest;
}

/**
  * Attach document ready handlers
  * @param {function()} callback
  * @param {*} context Context for handler
  */
var ready = (function(){
    var eventFired = !document || document.readyState == 'complete';
    var readyHandlers = [];
    var timer;

    function processReadyHandler(){
      var handler;

        // if any timer - reset it
        if (timer) {
            timer = clearTimeout(timer);
        }

        // if handlers queue has more than one handler, set emergency timer
        // make sure we continue to process the queue on exception
        // helps to avoid try/catch
        if (readyHandlers.length > 1) {
            timer = setTimeout(processReadyHandler, 0);
        }

        // process handler queue
        while (handler = readyHandlers.shift()) {
            handler[0].call(handler[1]);
        }

        // remove emergency timer as all handlers are process
        timer = clearTimeout(timer);
    }

    function fireHandlers(){
        if (!eventFired++) {
            processReadyHandler();
        }
    }

    // the DOM ready check for Internet Explorer
    function doScrollCheck(){
        try {
            // use the trick by Diego Perini
            // http://javascript.nwbox.com/IEContentLoaded/
            document.documentElement.doScroll('left');
            fireHandlers();
        } catch(e) {
            setTimeout(doScrollCheck, 1);
        }
    }

    if (!eventFired) {
        if (document.addEventListener) {
            // use the real event for browsers that support it (all modern browsers support it)
            document.addEventListener('DOMContentLoaded', fireHandlers, false);

            // a fallback to window.onload, that will always work
            global.addEventListener('load', fireHandlers, false);
        } else {
            // ensure firing before onload,
            // maybe late but safe also for iframes
            document.attachEvent('onreadystatechange', fireHandlers);

            // a fallback to window.onload, that will always work
            global.attachEvent('onload', fireHandlers);

            // if not a frame continually check to see if the document is ready
            try {
                if (!global.frameElement && document.documentElement.doScroll) {
                    doScrollCheck();
                }
            } catch(e) {}
        }
    }

    // return attach function
    return function(callback, context){
        // if no ready handlers yet and no event fired,
        // set timer to run handlers async
        if (!readyHandlers.length && eventFired && !timer) {
            timer = setTimeout(processReadyHandler, 0);
        }

        // add handler to queue
        readyHandlers.push([callback, context]);
    };
})();

module.exports = {
    complete: complete
};
