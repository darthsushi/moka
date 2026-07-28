import Map from './elements/Map';
import PlacementsList from './elements/PlacementList';

function Home() {
  return (
    <section
      className="w-full h-screen flex overflow-y-auto"
      style={{
        height: 'calc(100% - 80px)'
      }}
    >
      <PlacementsList />
      <Map />
    </section>
  );
}

export default Home;
