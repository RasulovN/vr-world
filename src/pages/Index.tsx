import { GameWorld } from '@/components/game/GameWorld';
import { Helmet } from 'react-helmet';

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Cyber World - 3D Virtual Muhit</title>
        <meta name="description" content="3D virtual muhitda avatarni harakatlantiring va AI yordamida ob'yektlarni yarating. WASD tugmalari bilan boshqaring." />
      </Helmet>
      <GameWorld />
    </>
  );
};

export default Index;
