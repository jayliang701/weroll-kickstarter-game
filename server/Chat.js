/**
 * Created by Jay on 2017/1/24.
 */

var rooms = {};

function wrapperPacket(data, client) {
    return new Promise(async function (resolve, reject) {
        try {
            if (client) {
                if (typeof client == "string") {
                    var user = await User.findOne({ _id:client }, "_id nickname");
                    data.user = { nickname:user.get("nickname"), id:user._id };
                } else {
                    data.user = client;
                }
            }
            data.time = Date.now();
        } catch (exp) {
            console.error(exp);
            return reject(exp);
        }
        resolve(data);
    });

    return data;
}

function enterRoom(socket, roomID) {
    return new Promise(async function (resolve, reject) {
        try {
            var data = await wrapperPacket({ room:roomID }, socket.clientID);
            await socket.helper.enterRoom(roomID);
            socket.__currentRoom = roomID;
            var room = rooms[socket.__currentRoom];
            if (!room) {
                room = { users:{} };
                rooms[socket.__currentRoom] = room;
            }
            room.users[socket.clientID] = data.user;
            socket.helper.broadcastToRoomWithoutSender(socket.__currentRoom, "enter", data);
            data.users = room.users;
            socket.emit("enter", data);
        } catch (exp) {
            console.error(exp);
            return reject(exp);
        }
        resolve();
    });
}

function leaveRoom(socket, roomID) {
    return new Promise(async function (resolve, reject) {
        try {
            var data = await wrapperPacket({ room:roomID, id:socket.clientID });
            var room = rooms[roomID];
            if (room) delete room.users[socket.clientID];
            socket.helper.broadcastToRoom(roomID, "leave", data);
            if (roomID == socket.__currentRoom) socket.__currentRoom = undefined;
        } catch (exp) {
            console.error(exp);
            return reject(exp);
        }
        resolve();
    });
}

Realtime.on("disconnect", async function(socket) {
    try {
        await leaveRoom(socket, socket.__currentRoom);
    } catch (exp) {
        console.error(exp);
    }
});

Realtime.on("shakeHandSuccess", async function(socket) {
    try {
        await enterRoom(socket, 'lobby');
    } catch (exp) {
        console.error(exp);
    }
});

Realtime.on("enter", async function(socket, data) {
    try {
        if (socket.__currentRoom && socket.__currentRoom != data.room) {
            await leaveRoom(socket, socket.__currentRoom);
        }
        await enterRoom(socket, data.room);
    } catch (exp) {
        console.error(exp);
    }
});

Realtime.on("talk", async function(socket, data) {
    try {
        var room = rooms[socket.__currentRoom];
        var client = room.users[socket.clientID];
        data = await wrapperPacket(data, client || socket.clientID);
        data.time = Date.now();
        if (data.room || socket.__currentRoom) {
            socket.helper.broadcastToRoom(data.room || socket.__currentRoom, "talk", data);
        } else {
            socket.helper.broadcast("talk", data);
        }
    } catch (exp) {
        console.error(exp);
    }
});

