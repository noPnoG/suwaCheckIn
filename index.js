const axios = require("axios")
const url = "https://m.sw11.icu/api_mweb/login"
axios
  .post(url, {
    data: {
      email: "zcvvvbb@sina.com",
      passwd: "k1994929",
      token: "e879dd020d5378c27e5d13ea94219d0e",
    },
  })
  .then((res) => {
    console.log(res)
  })
