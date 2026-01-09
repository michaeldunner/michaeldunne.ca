"use client";
import { Code } from "./code";

export function RREF() {
  return (
    <Code
      title="#130 The Atrocious"
      subtitle="Gyarados"
      date="2026-01-06"
      code={`const DummyComponent = () => {
  const [count, setCount] = React.useState(0);
 
  const handleClick = () => {
    setCount(prev => prev + 1);
  };
 
  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-xl font-bold mb-4">Fights Counter</h2>
      <p className="mb-2">Fight Club Fights Count: {count}</p>
      <button 
        onClick={handleClick}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Increment
      </button>
    </div>
  );
};
`}
      description={
        <>
          <p>
            Rarely seen in the wild, huge and vicious, it is capable of
            destroying entire cities in a rage. In the coding world, this
            represents technical debt left unchecked.
          </p>
          <p>
            However, when tamed, it becomes a powerful ally. Refactoring large
            codebases requires the same patience as training a Magikarp. It
            seems useless at first—small commits, minor tweaks—but eventually,
            it evolves into something majestic.
          </p>
          <h3>Research Notes</h3>
          <p>
            Recent studies show that automated testing reduces the "Rage" status
            effect by 45%. Implementing CI/CD pipelines ensures that the beast
            remains calm during deployment.
          </p>
        </>
      }
    />
  );
}
