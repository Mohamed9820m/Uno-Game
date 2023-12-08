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
  const [drawnThisTurn, setDrawnThisTurn] = useState(Array.from({ length: numPlayers }, () => false));
  const [playingDirection, setPlayingDirection] = useState(1); // 1 for default, -1 for reversed


  const unoDeckRef = useRef(new Deck());

  useEffect(() => {
    unoDeckRef.current.resetDeck(); // Reset the deck before each game
    unoDeckRef.current.shuffle();

     const filteredCards = unoDeckRef.current.cards.filter(
    card =>
      !card.includes('Skip') &&
      !card.includes('Reverse') &&
      !card.includes('Draw') &&
      !card.includes('Wild')
  );

  // Set deletedCard with a random card from the filtered deck
  const randomIndex = Math.floor(Math.random() * filteredCards.length);
  const randomCard = filteredCards[randomIndex];
  setDeletedCard(randomCard);

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

      // Check if the player has played a "Reverse" card
      if (card.includes('Reverse')) {
        // Dynamically reverse the playing direction
        setPlayingDirection((prevDirection) => -prevDirection);

        // Move to the previous player's turn immediately
        setCurrentPlayer((prevPlayer) => (prevPlayer - 1 + numPlayers) % numPlayers);
      } else {
        // Move to the next player's turn based on the dynamic playing direction
        setCurrentPlayer((prevPlayer) => (prevPlayer + playingDirection + numPlayers) % numPlayers);
      }

      // Check if the player has only one card left and hasn't said "Uno"
      if (updatedHands[playerIndex].length === 1 && !unoPlayers[playerIndex]) {
        // Automatically add two cards to the player's hand
        const drawnCards = unoDeckRef.current.dealHand(4);
        updatedHands[playerIndex] = [...updatedHands[playerIndex], ...drawnCards];
        setPlayerHands(updatedHands);
        console.log(`Player ${playerIndex + 1} didn't say Uno and drew two penalty cards.`);
      }

      // Check if the player has completed all cards
      if (updatedHands[playerIndex].length === 0) {
        alert(`Player ${playerIndex + 1} has completed all cards!`);
        resetGame();
      } else {
        // Reset Uno status for all players
        setUnoPlayers(Array.from({ length: numPlayers }, () => false));

        // Reset drawnThisTurn flag for all players
        setDrawnThisTurn(Array.from({ length: numPlayers }, () => false));
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
    if (!drawnThisTurn[currentPlayer]) {
      // Check if there are cards remaining in the deck
      if (unoDeckRef.current.cards.length === 0) {
        console.log("The deck is empty.");
        return; // Don't proceed if the deck is empty
      }

      // Draw one card from the deck and add it to the current player's hand
      const updatedHands = [...playerHands];
      const drawnCard = unoDeckRef.current.drawCard();

      if (drawnCard) {
        updatedHands[currentPlayer] = [...updatedHands[currentPlayer], drawnCard];
        setPlayerHands(updatedHands);
        console.log("Number of cards remaining in the deck after drawing one card:", unoDeckRef.current.cards.length);

        // Set the flag to indicate that the current player has drawn a card this turn
        setDrawnThisTurn((prevDrawnThisTurn) => {
          const updatedDrawnThisTurn = [...prevDrawnThisTurn];
          updatedDrawnThisTurn[currentPlayer] = true;
          return updatedDrawnThisTurn;
        });
      }
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

  const handlePassClick = () => {
    // Check if the current player has drawn a card during the current turn
    if (drawnThisTurn[currentPlayer]) {
      // Move to the next player's turn without doing anything else
      setCurrentPlayer((prevPlayer) => (prevPlayer + 1) % numPlayers);
      setUnoPlayers(Array.from({ length: numPlayers }, () => false));
      // Reset drawnThisTurn flag for all players
      setDrawnThisTurn(Array.from({ length: numPlayers }, () => false));
    } else {
      console.log("Cannot pass without drawing a card first.");
      // You may want to show a message or handle this case differently
    }
  };

  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x, y, radius, startAngle, endAngle) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);

    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    return [
      'M',
      start.x,
      start.y,
      'A',
      radius,
      radius,
      0,
      largeArcFlag,
      0,
      end.x,
      end.y,
    ].join(' ');
  };

  const playerRadius = 300; // Adjust the radius as needed
  const centerCoords = { x: 0, y: 0 };

  const playerPositions = Array.from({ length: numPlayers }).map(
    (_, index) => (360 / numPlayers) * index
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        margin: '25%',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '400px', // Adjust the width as needed
          height: '400px', // Adjust the height as needed
        }}
        >
<div className='title' style={{ textAlign: 'center', margin: '150px auto' }}>
  <h1>{deletedCard}</h1>
</div>

 <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
          >
          {[...Array(numPlayers).keys()].map((playerIndex) => {
            const position = playerPositions[playerIndex];
            const playerCoords = polarToCartesian(
              centerCoords.x,
              centerCoords.y,
              playerRadius,
              position
            );

            const isHorizontalLayout =
              playerIndex % 2 === 0 || // for the player at the top
              (playerIndex === numPlayers - 1 && numPlayers % 2 === 0); // for the player at the bottom in even player count

            const playerStyle = {
              position: 'absolute',
              top: `${playerCoords.y}px`,
              left: `${playerCoords.x}px`,
              transform: `translate(-50%, -50%) rotate(${position}deg)`,
            };

            const cardContainerStyle = {
              display: 'flex',
              flexDirection: isHorizontalLayout ? 'row' : 'row',
              alignItems: 'center',
              position: 'relative',
            };

                        const isCurrentPlayer = currentPlayer === playerIndex;


            const cards = playerHands[playerIndex].map((card, cardIndex) => (
              <Card
                key={cardIndex}
                value={card}
                onClick={() => handleCardClick(playerIndex, cardIndex)}
                style={{
                  position: 'absolute',
                  [isHorizontalLayout ? 'left' : 'top']: `${cardIndex * 20}px`,
                  transform: `translate(-50%, -50%)`,
                }}
              />
            ));

            return (
              <div key={playerIndex} style={playerStyle}>
                <div style={cardContainerStyle}>{cards}</div>
                <div style={{ marginTop: '50px' }}>
                  <h2 style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '10px'}}>{playerNames[playerIndex]}</h2>
                  {playerHands[playerIndex].length === 2 &&
                    currentPlayer === playerIndex && (
                      <button
                        onClick={handleUnoClick}
                        disabled={unoPlayers[playerIndex]}
                      >
                        Uno
                      </button>
                    )}

{isCurrentPlayer && (
                    <>
                      <button onClick={handleDrawCardClick}>
                        Draw One Card
                      </button>
                      <button onClick={handlePassClick}>
                        Pass
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default Page;