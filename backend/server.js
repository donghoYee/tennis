const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { initializeDatabase, tournaments, teams, matches } = require('./database');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

app.use(cors());
app.use(express.json());

// Helper function to generate bracket matches
const generateBracket = (teamCount) => {
  const matches = [];
  let matchId = 1;
  const rounds = Math.ceil(Math.log2(teamCount));
  
  for (let round = 1; round <= rounds; round++) {
    const matchesInRound = Math.pow(2, rounds - round);
    
    for (let matchIndex = 0; matchIndex < matchesInRound; matchIndex++) {
      matches.push({
        id: `match-${matchId}`,
        round,
        matchIndex,
        team1_id: null,
        team2_id: null
      });
      matchId++;
    }
  }

  return matches;
};

// Tournament Routes
app.get('/api/tournaments', async (req, res) => {
  try {
    const tournamentList = await tournaments.getAll();
    res.json(tournamentList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tournaments/:id', async (req, res) => {
  try {
    const tournament = await tournaments.getById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    const tournamentTeams = await teams.getByTournamentId(req.params.id);
    const tournamentMatches = await matches.getByTournamentId(req.params.id);

    res.json({
      ...tournament,
      teams: tournamentTeams,
      matches: tournamentMatches
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tournaments', async (req, res) => {
  try {
    const { name, teamCount } = req.body;
    const tournamentId = `tournament-${Date.now()}`;

    // Create tournament
    await tournaments.create({
      id: tournamentId,
      name,
      team_count: teamCount
    });

    // Create teams
    const tournamentTeams = [];
    for (let i = 0; i < teamCount; i++) {
      const team = {
        id: `team-${i + 1}-${tournamentId}`,
        tournament_id: tournamentId,
        name: `Team ${i + 1}`
      };
      await teams.create(team);
      tournamentTeams.push(team);
    }

    // Generate and create matches
    const bracketMatches = generateBracket(teamCount);
    const tournamentMatches = [];
    
    for (const match of bracketMatches) {
      const matchData = {
        id: `${match.id}-${tournamentId}`,
        tournament_id: tournamentId,
        team1_id: null,
        team2_id: null,
        round: match.round,
        match_index: match.matchIndex
      };
      await matches.create(matchData);
      tournamentMatches.push(matchData);
    }

    // Assign teams to first round matches
    const firstRoundMatches = tournamentMatches.filter(m => m.round === 1);
    for (let i = 0; i < Math.min(teamCount, firstRoundMatches.length * 2); i += 2) {
      if (firstRoundMatches[i / 2]) {
        const team1 = tournamentTeams[i] || null;
        const team2 = tournamentTeams[i + 1] || null;
        
        await matches.updateAdvancement(
          firstRoundMatches[i / 2].id,
          team1?.id || null,
          team2?.id || null
        );
      }
    }

    // Broadcast tournament creation
    io.emit('tournament_created', {
      id: tournamentId,
      name,
      team_count: teamCount
    });

    res.status(201).json({
      id: tournamentId,
      name,
      teamCount,
      teams: tournamentTeams,
      matches: tournamentMatches
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/tournaments/:id', async (req, res) => {
  try {
    await tournaments.delete(req.params.id);
    
    // Broadcast tournament deletion
    io.emit('tournament_deleted', { id: req.params.id });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Team Routes
app.put('/api/teams/:id', async (req, res) => {
  try {
    const { name } = req.body;
    await teams.updateName(req.params.id, name);
    
    // Broadcast team name update
    io.emit('team_updated', {
      id: req.params.id,
      name
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Match Routes
app.put('/api/matches/:id/score', async (req, res) => {
  try {
    const { score1, score2, winnerId, tournamentId } = req.body;
    
    await matches.updateScore(req.params.id, score1, score2, winnerId);
    
    // Get match details to find next round advancement
    const tournamentMatches = await matches.getByTournamentId(tournamentId);
    const updatedMatch = tournamentMatches.find(m => m.id === req.params.id);
    
    if (updatedMatch && winnerId) {
      // Find next round match
      const nextRound = updatedMatch.round + 1;
      const nextMatchIndex = Math.floor(updatedMatch.match_index / 2);
      const nextMatch = tournamentMatches.find(
        m => m.round === nextRound && m.match_index === nextMatchIndex
      );
      
      if (nextMatch) {
        // Advance winner to next round
        const isFirstSlot = updatedMatch.match_index % 2 === 0;
        const team1Id = isFirstSlot ? winnerId : nextMatch.team1_id;
        const team2Id = isFirstSlot ? nextMatch.team2_id : winnerId;
        
        await matches.updateAdvancement(nextMatch.id, team1Id, team2Id);
      }
    }
    
    // Check if tournament is completed
    const allMatches = await matches.getByTournamentId(tournamentId);
    const completedMatches = allMatches.filter(m => m.winner_id !== null).length;
    const totalMatches = allMatches.length;
    
    // If all matches are completed, mark tournament as inactive
    if (completedMatches >= totalMatches) {
      const { db } = require('./database');
      await new Promise((resolve, reject) => {
        db.run('UPDATE tournaments SET is_active = 0 WHERE id = ?', [tournamentId], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
    
    // Broadcast match update
    io.emit('match_updated', {
      matchId: req.params.id,
      tournamentId,
      score1,
      score2,
      winnerId
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join_tournament', (tournamentId) => {
    socket.join(tournamentId);
    console.log(`User ${socket.id} joined tournament ${tournamentId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Initialize database and start server
const PORT = process.env.PORT || 3001;

initializeDatabase()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Frontend should connect to: http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });
