function TestLab() {
  const algo = () => {
    alert('algo')
  };

  return (
    <div className="test-lab">
      <h1>Test Lab</h1>
      <p>This is the Test Lab page.</p>

      <button
        onClick={ algo }
        className="bg-red-300 px-5 py-2 rounded-2xl cursor-pointer"
      >
        Hola
      </button>
    </div>
  );
};

export default TestLab;
