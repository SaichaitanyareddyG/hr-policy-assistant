/**
 * How It Works Section Component
 * 
 * Explains the product workflow in 3 steps
 */

export function HowItWorks() {
  const steps = [
    {
      number: '1',
      title: 'HR uploads policy PDFs',
      description: 'Upload your benefits guide, leave policy, code of conduct, or any HR document. We process it automatically.',
    },
    {
      number: '2',
      title: 'Employees ask questions',
      description: 'Your team types questions in plain English. AI searches your policies and provides accurate answers with sources.',
    },
    {
      number: '3',
      title: 'HR tracks analytics',
      description: 'See which questions are asked most, what AI can\'t answer, and get feedback to improve your policies.',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            How it works
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get started in minutes. No complex setup, no AI training required.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-blue-300 to-blue-200" />
              )}

              {/* Step Card */}
              <div className="relative bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-2xl font-bold mb-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
