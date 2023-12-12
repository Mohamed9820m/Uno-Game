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
        this.cards.push('Draw '+color);
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

const Card = ({ value, onClick, isPlayable, isCurrentPlayer }) => (
  <button
    onClick={onClick}
    style={{
      margin: '8px',
      padding: '10px',
      fontSize: '16px',
      width: '50px',
      height: '80px',
      border: `2px solid ${isCurrentPlayer && isPlayable ? 'red' : 'black'}`, // Change border color based on playability and current player
      borderRadius: '8px',
      backgroundColor: 'gray',
    }}
  >
    {value}
  </button>
);



const Page = () => {
  const [numPlayers, setNumPlayers] = useState(4); // maximum 8 players
  const [playerHands, setPlayerHands] = useState(Array.from({ length: numPlayers }, () => []));
  const [playerNames, setPlayerNames] = useState(
    Array.from({ length: numPlayers }, (_, index) => ({
      name: `Player ${index}`,
      id: index, // Assign a unique ID to each player
    }))
  );
  const [deletedCard, setDeletedCard] = useState('');
  const [currentPlayer, setCurrentPlayer] = useState(0); // Track the current player's turn
  const [unoPlayers, setUnoPlayers] = useState(Array.from({ length: numPlayers }, () => false)); // Track players who said "Uno"
  const [drawnThisTurn, setDrawnThisTurn] = useState(Array.from({ length: numPlayers }, () => false));
  const [direction, setDirection] = useState(1); // 1 for clockwise, -1 for counterclockwise
  const [next, setNext] = useState(0); // Introduce nextPlayer state


  const [wildColor, setWildColor] = useState('');
  const [isWildColorSelectionOpen, setIsWildColorSelectionOpen] = useState(false);



  const [canPlay, setCanPlay] = useState(true);

const [deletedCardColor, setDeletedCardColor] = useState('');
const [deletedCardNumber, setDeletedCardNumber] = useState('');


  const unoDeckRef = useRef(new Deck());
  const initialPlayerRef = useRef(null);


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
  
    // Extract number and color from the randomCard
    const [number, color] = randomCard.split(' ');
  
    setDeletedCard(randomCard);


    setDeletedCardNumber(number);
    setDeletedCardColor(color);
  
 
  
    console.log("Number of cards remaining in the deck after shuffle:", unoDeckRef.current.cards.length);
    setPlayerHands(Array.from({ length: numPlayers }, () => unoDeckRef.current.dealHand(7)));
  
    // Log the initial player information
    const initialPlayer = currentPlayer;
    const nextPlayer = (currentPlayer + direction + numPlayers) % numPlayers + 1;
    console.log(`Initial player: ${initialPlayer}, Next player: ${nextPlayer - 1}`);
  }, [numPlayers]);

  useEffect(() => {
    console.log("First Deleted Card Color:", deletedCardColor);
    console.log("First Deleted Card Number:", deletedCardNumber);
  }, [deletedCardColor,deletedCardNumber]);


  
  const canPlayCard = (card) => {
    const [selectedNumber, selectedColor] = card.split(' ');
    const [prevNumber, prevColor] = deletedCard.split(' ');
  
    // Check if the selected card has the same color or number as the previously played card
    return selectedNumber === prevNumber || selectedColor === prevColor || (selectedNumber === 'Draw' && selectedColor === prevColor) || (selectedNumber === 'Wild' || selectedNumber === 'Wild Draw 4') ;
  };

  const handleCardClick = (playerIndex, cardIndex) => {
    if (playerIndex === currentPlayer && canPlay) {
      const updatedHands = [...playerHands];
      const card = updatedHands[playerIndex][cardIndex];
  
      const isPlayable = canPlayCard(card); // Check if the card is playable
  
      if (isPlayable) {
        // Remove the played card from the player's hand
        updatedHands[playerIndex].splice(cardIndex, 1);
        setPlayerHands(updatedHands);
        setDeletedCard(card);
  
        const [number, color] = card.split(' ');
        console.log(`Player ${playerNames[currentPlayer].id} played a ${color} ${number} card.`);
  
        const initialPlayer = playerNames[currentPlayer].id;
        const nextPlayer = (currentPlayer + direction + numPlayers) % numPlayers;
  
        console.log(`Player ${initialPlayer} played a card. Current player: ${nextPlayer}, Next player: ${(nextPlayer + direction + numPlayers) % numPlayers}`);
  
        initialPlayerRef.current = initialPlayer;
        setNext((nextPlayer + direction + numPlayers) % numPlayers);
  
        if (card.includes('Reverse')) {
          // Draw a card for the player after playing a reverse card
          const drawnCard = unoDeckRef.current.drawCard();
          if (drawnCard) {
            updatedHands[playerIndex] = [...updatedHands[playerIndex], drawnCard];
            setPlayerHands(updatedHands);
            console.log(`Player ${initialPlayer} drew a card after playing a reverse card.`);
          }
  
          // Switch the direction without changing the current player
          setDirection((prevDirection) => -prevDirection);
          setCurrentPlayer((prevPlayer) => (prevPlayer - direction + numPlayers) % numPlayers);
        }
        else if (card.includes('Wild') || card.includes('Wild Draw 4')) {
          // Handle the case where a wild card is played
          setIsWildColorSelectionOpen(true); 
        }
        
        else {
          // Move to the next player based on the game direction
          setCurrentPlayer((prevPlayer) => (prevPlayer + direction + numPlayers) % numPlayers);
        }
  
        if (updatedHands[playerIndex].length === 1 && !unoPlayers[playerIndex]) {
          // Draw two penalty cards if the player didn't say Uno
          const drawnCards = unoDeckRef.current.dealHand(2);
          updatedHands[playerIndex] = [...updatedHands[playerIndex], ...drawnCards];
          setPlayerHands(updatedHands);
          console.log(`Player ${initialPlayer} didn't say Uno and drew two penalty cards.`);
        }
  
        if (updatedHands[playerIndex].length === 0) {
          // Player completed all cards
          alert(`Player ${initialPlayer} has completed all cards!`);
          resetGame();
        } else {
          // Reset Uno and DrawnThisTurn flags for the next turn
          setUnoPlayers(Array.from({ length: numPlayers }, () => false));
          setDrawnThisTurn(Array.from({ length: numPlayers }, () => false));
        }
      } else {
        console.log(`Cannot play the selected card. Choose a card with the same color or number.`);
        // Optionally, you can show a message or handle this case differently
      }
    }
  };
  

  const handleWildColorSelection = (color) => {

    
    // Update the chosen color in the state
    setDeletedCardColor(color);
  
    // Close the Wild color selection modal
    setIsWildColorSelectionOpen(false);
  
    // Now, you can use the chosen color as needed in your game logic
    console.log(`Chosen Wild Color: ${color}`);
  };
  

  const handleUnoClick = () => {
    // Player can declare Uno only if they have one card left
    if (playerHands[currentPlayer].length === 2) {
      setUnoPlayers((prevUnoPlayers) => {
        const updatedUnoPlayers = [...prevUnoPlayers];
        updatedUnoPlayers[currentPlayer] = true; // Set Uno status for the current player
        return updatedUnoPlayers;
      });
    } else {
      // Player has more than one card
      console.log(`Player ${playerNames[currentPlayer].id} has more than one card. Uno cannot be declared.`);
      // Optionally, you can show a message or handle this case differently
    }
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
    if (drawnThisTurn[currentPlayer]) {
      // Calculate the next player's turn based on the game direction
      const nextPlayer = direction === 1 ? (next + 1) % numPlayers : (next + numPlayers - 1) % numPlayers;
      console.log('It will pass to', nextPlayer + 1);
  
      // Reset to 0 if the next player is equal to the number of players
      const updatedNext = nextPlayer === numPlayers ? 0 : nextPlayer;
  
      // Determine the card played during the current turn
      const playedCard = playerHands[currentPlayer][0]; // Assuming only one card is played per turn, adjust accordingly
  
      // Update the current player based on the game direction
      setCurrentPlayer((prevPlayer) => (prevPlayer + direction + numPlayers) % numPlayers);
  
      // Change the game direction if a Reverse card was played
      setDirection((prevDirection) => playedCard.includes('Reverse') ? -prevDirection : prevDirection);
  
      // Update the next player
      setNext(updatedNext);
  
      // Reset flags
      setUnoPlayers(Array.from({ length: numPlayers }, () => false));
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
                isPlayable={canPlayCard(card)}
                isCurrentPlayer={isCurrentPlayer} // Pass whether the card belongs to the current player
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
                  <h2 style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '10px'}}>
                    {playerNames[playerIndex].name}
                  </h2>
                  {playerHands[playerIndex].length === 2 && currentPlayer === playerIndex && (
                    <button
                      onClick={handleUnoClick}
                      disabled={unoPlayers[playerIndex]}
                    >
                      Uno
                    </button>
                  )}

                  {isCurrentPlayer && (
                    <>
                      <button onClick={handleDrawCardClick}>Draw One Card</button>
                      <button onClick={handlePassClick}>Pass</button>
                    </>
                  )}




{isWildColorSelectionOpen && (
  <div>
    <div style={{ position: 'fixed', top: '0', left: '0', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', padding: '20px', background: '#fff' }}>
        <p>Choose a color:</p>
        <button onClick={() => handleWildColorSelection('Red')}>Red</button>
        <button onClick={() => handleWildColorSelection('Blue')}>Blue</button>
        <button onClick={() => handleWildColorSelection('Yellow')}>Yellow</button>
        <button onClick={() => handleWildColorSelection('Green')}>Green</button>
      </div>
    </div>
  </div>
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