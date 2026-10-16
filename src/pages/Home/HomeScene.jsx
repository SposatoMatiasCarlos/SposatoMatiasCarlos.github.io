import Scene from '../../three/Scene.jsx';
import FolderFloat3D from '../../three/folder/FolderFloat3D.jsx';

function HomeScene({ projects, setPage }) {
  return (
    <div className="home__scene">
      <Scene camera={{ position: [0, 0.4, 6.5], fov: 40 }}>
        <FolderFloat3D items={projects} onSelect={setPage} />
      </Scene>
    </div>
  );
}

export default HomeScene;
