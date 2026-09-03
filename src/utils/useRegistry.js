import { ref } from "vue";

export const registeredElements = ref([]);

export const useElementsRegistry = () => {
  const registerElement = (data) => {
    registeredElements.value.push(data);
  };

  const unregisterElement = (id) => {
    registeredElements.value = registeredElements.value.filter(
      (el) => el.id !== id,
    );
  };

  return { registeredElements, registerElement, unregisterElement };
};
