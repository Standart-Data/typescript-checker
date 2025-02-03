class AbstractProcessor {

    constructor(props) {

        this.files = {}
        this.code = ""
        this.options = {}
        this.errors = []
        this.result = ""

    }

    validate() {
        console.log("Not Implemented")
    }

    process(){
        console.log("Not Implemented")
    }
}

module.exports = {AbstractProcessor}