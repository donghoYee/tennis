const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { initializeDatabase, tournaments, teams, matches, qualifiers, qualifierTeams, qualifierMatches } = require('./database');
const XLSX = require('xlsx');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true
}));
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
        name: `Team ${i + 1}`,
        position: i + 1
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

// Qualifier Routes
app.get('/api/qualifiers', async (req, res) => {
  try {
    const qualifierList = await qualifiers.getAll();
    res.json(qualifierList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/qualifiers/:id', async (req, res) => {
  try {
    const qualifier = await qualifiers.getById(req.params.id);
    if (!qualifier) {
      return res.status(404).json({ error: 'Qualifier not found' });
    }

    const qualifierTeamsList = await qualifierTeams.getByQualifierId(req.params.id);
    const qualifierMatchesList = await qualifierMatches.getByQualifierId(req.params.id);

    res.json({
      ...qualifier,
      teams: qualifierTeamsList,
      matches: qualifierMatchesList
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/qualifiers', async (req, res) => {
  try {
    const { name, teamCount } = req.body;
    const qualifierId = `qualifier-${Date.now()}`;

    // Create qualifier
    await qualifiers.create({
      id: qualifierId,
      name,
      team_count: teamCount
    });

    // Create teams
    const qualifierTeamsList = [];
    for (let i = 0; i < teamCount; i++) {
      const team = {
        id: `qteam-${i + 1}-${qualifierId}`,
        qualifier_id: qualifierId,
        name: `Team ${i + 1}`,
        position: i + 1
      };
      await qualifierTeams.create(team);
      qualifierTeamsList.push(team);
    }

    // Create qualifier matches (pair teams for head-to-head matches)
    const qualifierMatchesList = [];
    for (let i = 0; i < teamCount; i += 2) {
      if (i + 1 < teamCount) {
        const matchData = {
          id: `qmatch-${Math.floor(i / 2) + 1}-${qualifierId}`,
          qualifier_id: qualifierId,
          team1_id: qualifierTeamsList[i].id,
          team2_id: qualifierTeamsList[i + 1].id,
          match_index: Math.floor(i / 2)
        };
        await qualifierMatches.create(matchData);
        qualifierMatchesList.push(matchData);
      }
    }

    // Broadcast qualifier creation
    io.emit('qualifier_created', {
      id: qualifierId,
      name,
      team_count: teamCount
    });

    res.status(201).json({
      id: qualifierId,
      name,
      teamCount,
      teams: qualifierTeamsList,
      matches: qualifierMatchesList
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/qualifiers/:id', async (req, res) => {
  try {
    await qualifiers.delete(req.params.id);
    
    // Broadcast qualifier deletion
    io.emit('qualifier_deleted', { id: req.params.id });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Qualifier Team Routes
app.put('/api/qualifier-teams/:id', async (req, res) => {
  try {
    const { name } = req.body;
    await qualifierTeams.updateName(req.params.id, name);
    
    // Broadcast qualifier team name update
    io.emit('qualifier_team_updated', {
      id: req.params.id,
      name
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Qualifier Match Routes
app.put('/api/qualifier-matches/:id/score', async (req, res) => {
  try {
    const { score1, score2, winnerId, qualifierId } = req.body;
    
    await qualifierMatches.updateScore(req.params.id, score1, score2, winnerId);
    
    // Broadcast qualifier match update
    io.emit('qualifier_match_updated', {
      matchId: req.params.id,
      qualifierId,
      score1,
      score2,
      winnerId
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Qualifier Export Route
app.get('/api/qualifiers/:id/export', async (req, res) => {
  try {
    const qualifier = await qualifiers.getById(req.params.id);
    if (!qualifier) {
      return res.status(404).json({ error: 'Qualifier not found' });
    }

    const qualifierMatchesList = await qualifierMatches.getByQualifierId(req.params.id);
    
    // Prepare data for Excel export
    const exportData = [];
    
    qualifierMatchesList.forEach(match => {
      if (match.score1 !== null && match.score2 !== null && match.winner_id) {
        // Add winner row
        const winnerTeamName = match.winner_id === match.team1_id ? match.team1_name : match.team2_name;
        const winnerScore = match.winner_id === match.team1_id ? match.score1 : match.score2;
        exportData.push({
          '경기번호-결과': `${match.match_index + 1}-승리`,
          '팀명': winnerTeamName,
          '점수': winnerScore
        });
        
        // Add loser row
        const loserTeamName = match.winner_id === match.team1_id ? match.team2_name : match.team1_name;
        const loserScore = match.winner_id === match.team1_id ? match.score2 : match.score1;
        exportData.push({
          '경기번호-결과': `${match.match_index + 1}-패배`,
          '팀명': loserTeamName,
          '점수': loserScore
        });
      }
    });

    // Sort by match number
    exportData.sort((a, b) => {
      const matchA = parseInt(a['경기번호-결과'].split('-')[0]);
      const matchB = parseInt(b['경기번호-결과'].split('-')[0]);
      if (matchA !== matchB) return matchA - matchB;
      // Within same match, winner comes first
      return a['경기번호-결과'].includes('승리') ? -1 : 1;
    });

    // Create Excel workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Auto-size columns
    const colWidths = [
      { wch: 15 }, // 경기번호-결과
      { wch: 20 }, // 팀명
      { wch: 10 }  // 점수
    ];
    ws['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(wb, ws, '예선전 결과');
    
    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    // Set headers for file download
    const fileName = `${qualifier.name}_예선전_결과.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    res.setHeader('Content-Length', buffer.length);
    
    res.send(buffer);
  } catch (error) {
    console.error('Export error:', error);
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
