import { GameWorld } from '@/components/game/GameWorld';
import { GameUI } from '@/components/game/GameUI';
import { Helmet } from 'react-helmet';
import { useState } from 'react';

const Index = () => {
  const [physicsEnabled, setPhysicsEnabled] = useState(false);

  return (
    <>
      <Helmet>
        <title>Cyber World - 3D Virtual Muhit</title>
        <meta name="description" content="3D virtual muhitda avatarni harakatlantiring va AI yordamida ob'yektlarni yarating. WASD tugmalari bilan boshqaring." />
      </Helmet>
      <GameWorld physicsEnabled={physicsEnabled} onPhysicsToggle={setPhysicsEnabled} />
    </>
  );
};

export default Index;
