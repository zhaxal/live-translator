import Button from "../Button";

function Home() {
  return (
    <>
      <Button>Start transcription</Button>
      <Button className="ml-2 bg-red-500 hover:bg-red-700">
        Stop transcription
      </Button>

      <textarea
        placeholder="Translation will appear here"
        className="w-full h-64 mt-4 p-2 border border-gray-300 rounded-md resize-none"
        disabled
        readOnly
      ></textarea>
    </>
  );
}

export default Home;
