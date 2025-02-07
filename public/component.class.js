Handlebars.registerHelper('eq', function(a, b) {
    return a === b; // Or a == b if you want loose equality
});

Handlebars.registerHelper('countTrue', function(arr, key) {
    if (!Array.isArray(arr) || typeof key !== 'string') { return 0 }

    return arr.reduce((count, item) => {
        if (item && typeof item === 'object' && item[key] === true) { return count + 1 } return count
    }, 0);
});

class Component {

    constructor(selector, templateName, data ){

        this.data = data
        this.templateName = templateName

        this.container = document.querySelector(selector)
        if (!this.container) { console.log(`Блок ${selector} НЕ найден`); return}

        this.template = this.compileTemplate(templateName)

        this.refs = {} // Ссылки на связанные объекты

    }

    compileTemplate(templateName){

        const templateNode = document.querySelector(`template#${templateName}`)
        if(!templateNode) { console.log(`Шаблон ${templateName} НЕ загружен`); return }
        const templateText = templateNode.innerHTML
        return Handlebars.compile(templateText)

    }

    update(data) {
        this.data = data
        this.render()
        return this
    }

    render(){
        console.log(`Обновлен контент блока ${this.templateName}`)
        this.container.innerHTML = this.template(this.data)
    }


}
