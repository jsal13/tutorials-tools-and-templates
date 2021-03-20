<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <p>Number is: {{ num }}</p>
    <v-btn @click="getThing" />
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "HelloWorld",
  data() {
    return { num: 0 };
  },
  props: {
    msg: String
  },
  methods: {
    getThing() {
      axios
        .post("http://localhost:8000/test", {
          num: '12'
        })
        .then(response => {
          console.log(response);
          this.num = response["data"]["data"];
        })
        .catch(function(error) {
          console.log(error);
        });
    }
  }
};
</script>
