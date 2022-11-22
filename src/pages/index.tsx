import Head from 'next/head';

export default function Home() {
  return (
    <div className='bg-zinc-900 h-screen w-screen flex flex-col items-center justify-center'>
      <Head>
        <title>Turing to binary</title>
      </Head>

      <main>
        {/* Simple form with upload file */}
        <div className='flex flex-col gap-2 mb-4'>
          <h1 className='text-white text-4xl font-bold'> Turing to binary </h1>
          <span className='text-white text-lg'>
            {' '}
            Convert a Turing machine built in JFLAP (.jff) to binary{' '}
          </span>
        </div>

        <form
          className='text-white flex flex-col gap-2'
          action='/api/convert'
          method='post'
          encType='multipart/form-data'>
          <div className='flex flex-col text-black bg-neutral-200 rounded-md p-2 gap-2'>
            <label
              htmlFor='file'
              className='font-bold'>
              Please upload a .jff file
            </label>
            <input
              type='file'
              name='file'
              accept='.jff'
              required
              multiple={false}
            />
            <span className='text-sm text-red-600 font-semibold'>
              {' '}
              OBS.: The file must be a Turing machine built with{' '}
              <a
                href='https://www.jflap.org/jflaptmp/july27-18/JFLAP7.1.jar'
                rel='norefereer noopener'
                className='font-bold hover:text-blue-600 transition ease-in-out'>
                JFLAP 7.1
              </a>{' '}
            </span>
          </div>
          <button
            type='submit'
            className='bg-sky-500 p-2 rounded-md hover:bg-sky-600 transition ease-in-out'>
            Convert
          </button>
        </form>
      </main>
    </div>
  );
}
