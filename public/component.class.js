class Component {

    constructor(selector, template, data ){

        const templateNode = document.querySelector(`template#${template}`)

        if(!templateNode) {
            console.log(`Шаблон ${template} НЕ загружен`)
            return
        }

        const templateText = templateNode.innerHTML

        this.templateName = template
        this.template = Handlebars.compile(templateText)
        this.container = document.querySelector(selector)

        if (!this.container) { console.log(`Блок ${selector} НЕ найден`); return}

        this.data = data
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
