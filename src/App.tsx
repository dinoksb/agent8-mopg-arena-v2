import { useEffect, useState } from "react";
import { useGameServer } from "@agent8/gameserver";
import GameComponent from "./components/GameComponent";
import LobbyScreen from "./components/LobbyScreen";
import LoadingScreen from "./components/LoadingScreen";
import "./App.css";

function App() {
  const { connected, server } = useGameServer();
  const [gameStarted, setGameStarted] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [roomId, setRoomId] = useState("");

  useEffect(() => {
    if (connected) {
      // Set a default player name if none exists
      const storedName = localStorage.getItem("playerName");
      if (storedName) {
        setPlayerName(storedName);
      } else {
        const defaultName = `Player${Math.floor(Math.random() * 1000)}`;
        setPlayerName(defaultName);
        localStorage.setItem("playerName", defaultName);
      }
    }
  }, [connected]);

  const handleStartGame = async (name: string, room: string = "") => {
    if (name.trim() !== "") {
      setPlayerName(name);
      localStorage.setItem("playerName", name);
      
      try {
        // Join or create a room
        const joinedRoomId = await server.remoteFunction("joinRoom", [room]);
        setRoomId(joinedRoomId);
        
        // Set player data
        await server.remoteFunction("setPlayerData", [{ name }]);
        
        setGameStarted(true);
      } catch (error) {
        console.error("Error joining room:", error);
        alert("Failed to join room. Please try again.");
      }
    }
  };

  const handleExitGame = async () => {
    try {
      await server.remoteFunction("leaveRoom", []);
      setGameStarted(false);
      setRoomId("");
    } catch (error) {
      console.error("Error leaving room:", error);
    }
  };

  if (!connected) {
    return <LoadingScreen message="Connecting to server..." />;
  }

  return (
    <div className="game-container">
      {!gameStarted ? (
        <LobbyScreen onStartGame={handleStartGame} initialName={playerName} />
      ) : (
        <GameComponent 
          playerName={playerName} 
          roomId={roomId} 
          onExitGame={handleExitGame} 
        />
      )}
    </div>
  );
}

export default App;
