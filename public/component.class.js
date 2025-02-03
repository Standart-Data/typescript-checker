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
