"use client";
import React, { useState, useEffect, useRef } from 'react';

class Deck {
  cards: string[] = [];
  originalDeck: string[] = [];

  constructor() {
    this.initialize();
    this.originalDeck = [...this.cards]; // Store the original deck
  }

  initialize() {
    const colors = ['Red', 'Blue', 'Green', 'Yellow'];
    const values = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

    for (const color of colors) {
      for (const value of values) {
        this.cards.push(value + ' ' + color);
        this.cards.push(value + ' ' + color);
      }
    }

    for (const color of colors) {
      for (let i = 0; i < 2; i++) {
        this.cards.push('Skip ' + color);
        this.cards.push('Reverse ' + color);
        this.cards.push('Draw ' + color);
      }
    }

    for (let i = 0; i < 4; i++) {
      this.cards.push('Wild');
      this.cards.push('Wild Draw 4');
    }
  }

  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  drawCard() {
    return this.cards.pop();
  }

  dealHand(numCards: number): string[] {
    const hand: string[] = [];
    for (let i = 0; i < numCards; i++) {
      hand.push(this.drawCard() || ''); 
    }
    return hand;
  }

  resetDeck() {
    this.cards = [...this.originalDeck];
  }
}

const Card = ({ value, onClick }) => (
  <button
    onClick={onClick}
    style={{
      margin: '8px',
      padding: '10px',
      fontSize: '16px',
      width: '50px',
      height: '80px',
      border: '2px solid black',
      borderRadius: '8px',
      backgroundColor: 'lightgray',
    }}
  >
    {value}
  </button>
);

const Page = () => {
  const [numPlayers, setNumPlayers] = useState(4); // maximum 8 players
  const [playerHands, setPlayerHands] = useState(Array.from({ length: numPlayers }, () => []));
  const [playerNames, setPlayerNames] = useState(Array.from({ length: numPlayers }, (_, index) => `Player ${index + 1}`));
  const [deletedCard, setDeletedCard] = useState('');
  const [currentPlayer, setCurrentPlayer] = useState(0); // Track the current player's turn
  const [unoPlayers, setUnoPlayers] = useState(Array.from({ length: numPlayers }, () => false)); // Track players who said "Uno"
  const unoDeckRef = useRef(new Deck());

  useEffect(() => {
    unoDeckRef.current.resetDeck(); // Reset the deck before each game
    unoDeckRef.current.shuffle();
    console.log("Number of cards remaining in the deck after shuffle:", unoDeckRef.current.cards.length);
    setPlayerHands(Array.from({ length: numPlayers }, () => unoDeckRef.current.dealHand(7)));
  }, [numPlayers]);

  const handleCardClick = (playerIndex, cardIndex) => {
    if (playerIndex === currentPlayer) {
      const updatedHands = [...playerHands];
      const card = updatedHands[playerIndex][cardIndex];
      updatedHands[playerIndex].splice(cardIndex, 1); // Remove the clicked card from the player's hand
      setPlayerHands(updatedHands);
      setDeletedCard(card); // Set the deleted card
      console.log("Number of cards remaining in the deck after card removal:", unoDeckRef.current.cards.length);

      // Check if the player has only one card left and hasn't said "Uno"
      if (updatedHands[playerIndex].length === 1 && !unoPlayers[playerIndex]) {
        // Draw two cards and add them to the player's hand
        const drawnCards = unoDeckRef.current.dealHand(2);
        updatedHands[playerIndex] = [...updatedHands[playerIndex], ...drawnCards];
        setPlayerHands(updatedHands);
        console.log(`Player ${playerIndex + 1} failed to say Uno. Drawing two cards.`);
      }

      // Check if the player has completed all cards
      if (updatedHands[playerIndex].length === 0) {
        alert(`Player ${playerIndex + 1} has completed all cards!`);
        resetGame();
      } else {
        // Move to the next player's turn
        setCurrentPlayer((prevPlayer) => (prevPlayer + 1) % numPlayers);

        // Reset Uno status for all players
        setUnoPlayers(Array.from({ length: numPlayers }, () => false));
      }
    }
  };

  const handleUnoClick = () => {
    // Player declares Uno
    setUnoPlayers((prevUnoPlayers) => {
      const updatedUnoPlayers = [...prevUnoPlayers];
      updatedUnoPlayers[currentPlayer] = true; // Set Uno status for the current player
      return updatedUnoPlayers;
    });
  };

  const handleDrawCardClick = () => {
    // Draw one card from the deck and add it to the current player's hand
    const updatedHands = [...playerHands];
    const drawnCard = unoDeckRef.current.drawCard();
    if (drawnCard) {
      updatedHands[currentPlayer] = [...updatedHands[currentPlayer], drawnCard];
      setPlayerHands(updatedHands);
      console.log("Number of cards remaining in the deck after drawing one card:", unoDeckRef.current.cards.length);
    }
  };

  const resetGame = () => {
    // Reset the game
    unoDeckRef.current.resetDeck();
    unoDeckRef.current.shuffle();
    console.log("Number of cards remaining in the deck after shuffle:", unoDeckRef.current.cards.length);
    setPlayerHands(Array.from({ length: numPlayers }, () => unoDeckRef.current.dealHand(7)));
    setCurrentPlayer(0);
    setUnoPlayers(Array.from({ length: numPlayers }, () => false));
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column', // Adjusted to column layout
        alignItems: 'center',
        margin: '20px',
      }}
    >

      <h1>Deleted Card: {deletedCard}</h1>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div style={{ margin: '20px' }}>
          <button onClick={handleDrawCardClick}>Draw One Card</button>
        </div>
        {[...Array(numPlayers).keys()].map((playerIndex) => (
          <div key={playerIndex} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '20px' }}>
            <h2>{playerNames[playerIndex]}</h2>
            
            {playerHands[playerIndex].map((card, cardIndex) => (
              <Card key={cardIndex} value={card} onClick={() => handleCardClick(playerIndex, cardIndex)} />
            ))}

            {playerHands[playerIndex].length === 2 && currentPlayer === playerIndex && (
              <button onClick={handleUnoClick} disabled={unoPlayers[playerIndex]}>
                Uno
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Page;