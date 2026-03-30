function calculate(num1, num2, operation) {
    if (isNaN(num1) || isNaN(num2)){
        return undefined;
    }
    if (operation === "Add") {
        return num1 + num2;
    }
    else if (operation === "Subtract") {
        return num1 - num2;
    }
    else if (operation === "Multiply") {
        return num1 * num2;
    }
    else if (operation === "Divide") {
        if (num2 === 0) {
            return 'Divide by zero error';
        } 
        else {
            return num1 / num2;
}
    }
    return undefined;
}

document.addEventListener('DOMContentLoaded', function () {

    const calc_form = document.getElementById('calc_form');
    const result_input = document.getElementById('result');
    const history_list = document.createElement('ul');
    const clear_button = document.getElementById('clear_button');
    const clear_all_button = document.getElementById('clear_all_button');
    
    clear_button.addEventListener('click', function() {
        calc_form.num1.value = '';
        calc_form.num2.value = '';
        result_input.value = '';
    });

    clear_all_button.addEventListener('click', function() {
        while (history_list.firstChild) {
            history_list.removeChild(history_list.firstChild);
        }
        calc_form.num1.value = '';
        calc_form.num2.value = '';
        result_input.value = '';
    });

    history_list.id = 'history';
    history_list.style.marginTop = "20px";
    result_input.parentNode.appendChild(history_list);

    calc_form.addEventListener('submit', function(event) {
        event.preventDefault(); //prevents the page from reloading so the result can be displayed without losing the input values

        const number1 = calc_form.num1.valueAsNumber;
        const number2 = calc_form.num2.valueAsNumber;
        const operation = calc_form.operation.value;
        const result = calculate(number1, number2, operation);
        
        if (result === undefined) {
            result_input.value = 'Invalid input';
        } else {
            result_input.value = result;
            const history_item = document.createElement('li');
            history_item.textContent = `${number1} ${operation} ${number2} = ${result}`;
            history_list.insertBefore(history_item, history_list.firstChild);
        }
    });
});   
