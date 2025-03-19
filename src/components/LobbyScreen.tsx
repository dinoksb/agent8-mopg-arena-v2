import React, { useState } from "react";

interface LobbyScreenProps {
  onStartGame: (name: string, roomId?: string) => void;
  initialName: string;
}

const LobbyScreen: React.FC<LobbyScreenProps> = ({ onStartGame, initialName }) => {
  const [playerName, setPlayerName] = useState(initialName);
  const [roomId, setRoomId] = useState("");
  const [joinRoom, setJoinRoom] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartGame(playerName, joinRoom ? roomId : "");
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-white mb-6">
          Combat Arena
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="playerName" className="block text-sm font-medium text-gray-300 mb-1">
              Your Name
            </label>
            <input
              type="text"
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="joinRoom"
              checked={joinRoom}
              onChange={() => setJoinRoom(!joinRoom)}
              className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-600 rounded"
            />
            <label htmlFor="joinRoom" className="text-sm font-medium text-gray-300">
              Join Existing Room
            </label>
          </div>

          {joinRoom && (
            <div>
              <label htmlFor="roomId" className="block text-sm font-medium text-gray-300 mb-1">
                Room ID
              </label>
              <input
                type="text"
                id="roomId"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={joinRoom}
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition duration-200"
          >
            {joinRoom ? "Join Game" : "Create New Game"}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-400">
          <p>Use WASD to move and left mouse button to attack</p>
        </div>
      </div>
    </div>
  );
};

export default LobbyScreen;
