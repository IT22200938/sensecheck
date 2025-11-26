import mongoose from 'mongoose';
import dotenv from 'dotenv';
import InteractionLog from './models/InteractionLog.js';
import MotorSkillsInteraction from './models/MotorSkillsInteraction.js';
import Session from './models/Session.js';

dotenv.config();

async function checkDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Count interactions in both collections
    const globalInteractionCount = await InteractionLog.countDocuments();
    const motorSkillsCount = await MotorSkillsInteraction.countDocuments();
    console.log(`📊 Total global interactions: ${globalInteractionCount}`);
    console.log(`🎯 Total motor skills interactions: ${motorSkillsCount}`);
    console.log(`📊 Total interactions (all): ${globalInteractionCount + motorSkillsCount}\n`);

    // Get recent global interactions
    if (globalInteractionCount > 0) {
      const recentGlobal = await InteractionLog.find()
        .sort({ timestamp: -1 })
        .limit(10);
      
      console.log('📝 Recent 10 global interactions:');
      recentGlobal.forEach((interaction, i) => {
        console.log(`${i + 1}. [${interaction.module}] ${interaction.eventType} - ${new Date(interaction.timestamp).toLocaleString()}`);
      });
      
      // Group by event type
      const eventTypes = await InteractionLog.aggregate([
        { $group: { _id: '$eventType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);
      
      console.log('\n📈 Top 10 event types:');
      eventTypes.forEach((type, i) => {
        console.log(`${i + 1}. ${type._id}: ${type.count}`);
      });
      
      // Group by module
      const modules = await InteractionLog.aggregate([
        { $group: { _id: '$module', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      
      console.log('\n📦 Global interactions by module:');
      modules.forEach((module, i) => {
        console.log(`${i + 1}. ${module._id}: ${module.count}`);
      });
    } else {
      console.log('\n⚠️  No global interactions found!');
    }

    // Motor skills interactions
    if (motorSkillsCount > 0) {
      const recentMotorSkills = await MotorSkillsInteraction.find()
        .sort({ timestamp: -1 })
        .limit(10);
      
      console.log('\n🎯 Recent 10 motor skills interactions:');
      recentMotorSkills.forEach((interaction, i) => {
        console.log(`${i + 1}. [Round ${interaction.round}] ${interaction.eventType} - ${new Date(interaction.timestamp).toLocaleString()}`);
      });
      
      // Group by event type
      const motorEventTypes = await MotorSkillsInteraction.aggregate([
        { $group: { _id: '$eventType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);
      
      console.log('\n🎮 Motor skills event types:');
      motorEventTypes.forEach((type, i) => {
        console.log(`${i + 1}. ${type._id}: ${type.count}`);
      });
      
      // Group by round
      const rounds = await MotorSkillsInteraction.aggregate([
        { $group: { _id: '$round', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);
      
      console.log('\n🔢 Motor skills by round:');
      rounds.forEach((round, i) => {
        console.log(`Round ${round._id}: ${round.count} interactions`);
      });
    } else {
      console.log('\n⚠️  No motor skills interactions found!');
    }

    if (globalInteractionCount === 0 && motorSkillsCount === 0) {
      console.log('\n⚠️  No interactions found in either collection!');
      console.log('\nPossible issues:');
      console.log('1. Frontend tracking not initialized');
      console.log('2. Backend not receiving requests');
      console.log('3. Database connection issue');
      console.log('4. Batching delay (wait 2-10 seconds and check again)');
    }

    // Check sessions
    const sessionCount = await Session.countDocuments();
    console.log(`\n👥 Total sessions: ${sessionCount}`);
    
    if (sessionCount > 0) {
      const recentSessions = await Session.find().sort({ createdAt: -1 }).limit(5);
      console.log('\n📋 Recent sessions:');
      recentSessions.forEach((session, i) => {
        console.log(`\n${i + 1}. Session: ${session.sessionId}`);
        console.log(`   👤 User: Age ${session.userInfo?.age || 'N/A'}, ${session.userInfo?.gender || 'N/A'}`);
        console.log(`   💻 Device: ${session.deviceType} - ${session.platform || 'Unknown platform'}`);
        console.log(`   📱 Screen: ${session.screenResolution?.width}x${session.screenResolution?.height}`);
        console.log(`   🖥️  Viewport: ${session.viewportWidth}x${session.viewportHeight}`);
        console.log(`   🎨 Theme: ${session.preferredTheme || 'N/A'}, DPR: ${session.devicePixelRatio || 'N/A'}`);
        console.log(`   🌐 Language: ${session.language || 'N/A'}, Connection: ${session.connectionType || 'N/A'}`);
        console.log(`   ♿ Accessibility: High Contrast=${session.highContrastMode || false}, Reduced Motion=${session.reducedMotionPreference || false}`);
      });
    }

    await mongoose.connection.close();
    console.log('\n✅ Database check complete');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  process.exit(0);
}

checkDatabase();

