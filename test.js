const mkPower = (y) => { 
    const power = (x) => {   //x is a local variable to power function 
        let ans =1 
        for (i =0; i < y; i++) {  //y is accessible as it is a global variable 
            ans = ans* x
        }
        return ans       //local variable x is gone after return statement
    }
    return power 
}

//javascript forces power to remember value of y when it runs square(5)



const square = mkPower(2) //value y=2 is sealed inside square function and cannot be changed 
const cube = mkPower(3)
const quad = mkPower(4)

console.log(square(5))
cube(5)
quad(5)