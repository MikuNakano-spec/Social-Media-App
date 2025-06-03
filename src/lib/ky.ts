import ky from "ky";

const kyInstance = ky.create({
  timeout: 10000,
  retry: {
    limit: 3, 
    methods: ["get", "post"],
  },
  parseJson: (text) =>
    JSON.parse(text, (key, value) => {
      if (key.endsWith("At")) return new Date(value);
      return value;
    }),
});


export default kyInstance;
