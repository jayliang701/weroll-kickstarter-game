/**
 * Created by Jay on 2017/1/24.
 */
var realtime = { debug: true, __reqs:[] };
realtime.traceLog = function() {
    var func = window.trace ? window.trace : (window.console ? window.console.log : null);
    func && func.apply(window, [ '<Realtime>' ].concat(Array.prototype.slice.call(arguments, 0)));
}
realtime.traceError = function() {
    var func = window.trace ? window.trace : (window.console ? window.console.error : null);
    func && func.apply(window, [ '<Realtime>' ].concat(Array.prototype.slice.call(arguments, 0)));
}
window.realtime = realtime;

realtime.connect = function(url, auth, callBack) {
    function Client(url) {
        var ins = this;
        var option = { forceNew:true };
        if (typeof arguments[0] == "string") url = arguments[0];
        else {
            option = arguments[0];
            if (option.host) {
                url = "http://" + option.host + ":" + (option.port || 80);
            }
        }

        var socket = io(url, option);
        this.socket = socket;
        socket.on("connect", function() {
            realtime.traceLog('connected to ' + url);
            realtime.traceLog('start shakehand with session: ', auth);
            socket.emit('$init', { _auth:auth });
        });
        socket.on("$init", function(data) {
            ins.clientID = socket.clientID = data.clientID;
            realtime.traceLog('shakehand success. clientID: ' + socket.clientID);
        });
        socket.on("disconnect", function() {
            ins.clientID = socket.clientID = undefined;
            realtime.traceLog('disconnected');
        });

        this.close = function() {
            try {
                socket.close();
                socket.disconnect();
            } catch (exp) { }
        }


        this.on = function(type, handler) {
            socket.on.apply(socket, [ type, handler ]);
        };
        this.once = function(type, handler) {
            socket.once.apply(socket, [ type, handler ]);
        };
        this.removeAllListeners = function(type) {
            socket.removeAllListeners.apply(socket, [ type ]);
        };
        this.removeListener = function(type, handler) {
            socket.removeListener.apply(socket, [ type, handler ]);
        };
        this.message = function(type, data) {
            socket && socket.emit("m", [ type, data ]);
        }
    }

    if (!realtime.ready) {
        //wait
        realtime.__reqs.push([ url, auth, callBack ]);
    } else {
        var client = new Client(url);
        setTimeout(function () {
            callBack && callBack(client);
        }, 0);
    }
}

$.getScript(window.RES_CDN_DOMAIN + "/js/socket.io.min.js", function() {
    realtime.ready = true;
    if (realtime.__reqs) {
        realtime.__reqs.forEach(function (args) {
            realtime.connect.apply(realtime, args);
        });
    }
});
