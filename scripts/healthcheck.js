fetch('http://127.0.0.1:3000/health')
  .then((res) => res.json())
  .then((body) => {
    console.log(JSON.stringify(body, null, 2));
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
