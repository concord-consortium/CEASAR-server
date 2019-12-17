
export const debug = (msg: string) => {
  const debug = process.env.CEASAR_DEBUG;
  if(debug){
    console.info(msg);
  }
};
